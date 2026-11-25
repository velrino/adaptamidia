import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as admin from 'firebase-admin'; // Importar o Admin SDK
import {
  FirebasePathsEnum,
  IFirebaseListenForNewRecords,
} from './firebase.enum';
import {
  GetGoogleCloudCredential,
  GoogleCloudCredential,
} from '../google/resouces';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { Environments, GetEnvironment } from '../general';

@Injectable()
export class FirebaseDatabaseService implements OnModuleInit, OnModuleDestroy {
  public database: admin.database.Database;
  private readonly workerId = randomUUID();

  constructor() {}

  async onModuleInit(): Promise<void> {
    try {
      if (!admin.apps.length) {
        if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
          const projectId = 'demo-adaptamidia';
          admin.initializeApp({
            projectId,
            databaseURL: `https://${projectId}.firebaseio.com`,
          });
        } else {
          const keyFilename = GetGoogleCloudCredential(
            GoogleCloudCredential[
              'see-midia-firebase-adminsdk-fbsvc-5f17c7af46.json'
            ],
          );
          admin.initializeApp({
            credential: admin.credential.cert(require(keyFilename)),
            databaseURL: 'https://see-midia-default-rtdb.firebaseio.com/',
          });
        }
      }

      this.database = admin.database();

      // this.database.ref(`DEV_DISPLAY_LOGS`).remove();
    } catch (error) {
      const about = 'Firebase Realtime Database initialization error';
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.onModuleInit.name,
        LogAction.FAILED,
        { about, error },
      );
      throw new Error(about);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      // Cleanup Firebase connections
      if (admin.apps.length) {
        await Promise.all(admin.apps.map((app) => app?.delete()));
      }
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.onModuleDestroy.name,
        LogAction.FAILED,
        { error },
      );
    }
  }

  // Resolve RTDB path by environment to avoid mixing DEV and RELEASE data
  private p(informed: FirebasePathsEnum): string {
    const env = GetEnvironment();

    const firebasePath = Object.values(Environments).includes(
      env as Environments,
    )
      ? informed
      : `DEV_${String(informed).toUpperCase()}`;

    // Log(
    //   LogType.INFO,
    //   FirebaseDatabaseService.name,
    //   'firebasePath',
    //   LogAction.SUCCESS,
    //   { firebasePath },
    // );

    return firebasePath;
  }

  // Set data at the root of a path (no id), with server timestamp
  async setRoot(path: FirebasePathsEnum, data: any): Promise<void> {
    try {
      const ref = this.database.ref(this.p(path));
      await ref.set({
        ...data,
        timestamp: admin.database.ServerValue.TIMESTAMP,
      });
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.setRoot.name,
        LogAction.FAILED,
        { path, data, error },
      );
      throw error;
    }
  }

  async save(path: FirebasePathsEnum, id: string, data: any): Promise<void> {
    try {
      // Use os métodos do Admin SDK para Realtime Database
      const deviceRef = this.database.ref(`${this.p(path)}/${id}`);
      return await deviceRef.set({
        ...data,
        timestamp: admin.database.ServerValue.TIMESTAMP, // Use o timestamp do servidor, é melhor!
      });
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.save.name,
        LogAction.FAILED,
        { data, error },
      );
      throw error;
    }
  }

  // Adicione este método na classe FirebaseDatabaseService
  async addRecord(path: FirebasePathsEnum, data: any): Promise<string> {
    try {
      const ref = this.database.ref(this.p(path));
      const newRecordRef = ref.push(); // Cria uma referência com ID automático

      await newRecordRef.set({
        ...data,
        timestamp: admin.database.ServerValue.TIMESTAMP,
      });

      return newRecordRef.key; // Retorna o ID do novo registro
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.addRecord.name,
        LogAction.FAILED,
        { data, error },
      );
      throw error;
    }
  }

  // Adicione este método na classe FirebaseDatabaseService
  async listenForNewRecords(
    parameters: IFirebaseListenForNewRecords,
  ): Promise<() => void> {
    try {
      const ref = this.database.ref(this.p(parameters.path));

      // Listener para novos registros
      const childAddedHandler = ref.on('child_added', async (snapshot) => {
        try {
          const data = snapshot.val();
          const key = snapshot.key;

          if (data && key) {
            // Tenta fazer o claim atômico do registro para evitar processamento duplicado
            const claimed = await this.tryClaimRecord(parameters.path, key);

            if (!claimed) return; // Outra instância já pegou ou já processado

            try {
              await parameters.callback(data, key);
              // await this.markRecordProcessed(parameters.path, key);
            } catch (callbackError) {
              // Se falhar no processamento, libera o claim para retry futuro
              await this.releaseClaim(parameters.path, key);
              throw callbackError;
            }
          }
        } catch (error) {
          Log(
            LogType.ERROR,
            FirebaseDatabaseService.name,
            'childAddedHandler',
            LogAction.FAILED,
            { error, parameters },
          );
        }
      });

      // Retorna uma função para remover o listener
      return () => ref.off('child_added', childAddedHandler);
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.listenForNewRecords.name,
        LogAction.FAILED,
        { error, parameters },
      );
      throw error;
    }
  }

  // Implementa um "claim" com lease para evitar processamento em paralelo
  private async tryClaimRecord(
    path: FirebasePathsEnum,
    id: string,
    leaseMs = 60_000, // 1 minuto de lease por padrão
  ): Promise<boolean> {
    const now = Date.now();
    const ref = this.database.ref(`${this.p(path)}/${id}`);

    try {
      const result = await new Promise<{
        committed: boolean;
        snapshot?: admin.database.DataSnapshot;
      }>((resolve, reject) => {
        ref.transaction(
          (current: any) => {
            if (!current) return; // registro removido
            if (current.processed) return; // já processado -> não altera (committed: false)

            const claimedAt = Number(current.claimed_at || 0);
            const hasClaim = Boolean(current.claimed_by);
            const isLeaseValid =
              hasClaim && claimedAt && now - claimedAt < leaseMs;

            if (isLeaseValid && current.claimed_by !== this.workerId) {
              // Outro worker ainda detém o lease
              return; // nenhum update -> committed false
            }

            // Faz o claim/renova o lease
            return {
              ...current,
              claimed_by: this.workerId,
              claimed_at: now,
            };
          },
          (error, committed, snapshot) => {
            if (error) return reject(error);
            resolve({
              committed: Boolean(committed),
              snapshot: snapshot as any,
            });
          },
          false,
        );
      });

      return result.committed;
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        'tryClaimRecord',
        LogAction.FAILED,
        { error, path, id },
      );
      return false;
    }
  }

  private async markRecordProcessed(
    path: FirebasePathsEnum,
    id: string,
  ): Promise<void> {
    try {
      const ref = this.database.ref(`${this.p(path)}/${id}`);
      await ref.update({
        processed: true,
        processed_at: Date.now(),
        processed_by: this.workerId,
      });
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        'markRecordProcessed',
        LogAction.FAILED,
        { error, path, id },
      );
    }
  }

  private async releaseClaim(
    path: FirebasePathsEnum,
    id: string,
  ): Promise<void> {
    try {
      const ref = this.database.ref(`${this.p(path)}/${id}`);
      const snapshot = await ref.once('value');
      const value = snapshot.val();
      if (value?.claimed_by === this.workerId && !value?.processed) {
        await ref.update({ claimed_by: null, claimed_at: null });
      }
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        'releaseClaim',
        LogAction.FAILED,
        { error, path, id },
      );
    }
  }

  // Distributed lock helpers (para crons e jobs únicos)
  async acquireLock(
    name: string,
    leaseMs = 30 * 60 * 1000, // 30 minutos por padrão
  ): Promise<boolean> {
    const now = Date.now();
    const ref = this.database.ref(`${this.p(FirebasePathsEnum.LOCKS)}/${name}`);
    try {
      const result = await new Promise<{ committed: boolean }>(
        (resolve, reject) => {
          ref.transaction(
            (current: any) => {
              const claimedAt = Number(current?.claimed_at || 0);
              const claimedBy = current?.claimed_by as string | undefined;
              const isLeaseValid =
                claimedBy && claimedAt && now - claimedAt < leaseMs;

              if (isLeaseValid && claimedBy !== this.workerId) {
                // Outro worker ainda mantém o lease
                return; // não altera
              }

              // Adquire ou renova lease
              return {
                claimed_by: this.workerId,
                claimed_at: now,
              };
            },
            (error, committed) => {
              if (error) return reject(error);
              resolve({ committed: Boolean(committed) });
            },
            false,
          );
        },
      );
      return result.committed;
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        'acquireLock',
        LogAction.FAILED,
        { error, name },
      );
      return false;
    }
  }

  async releaseLock(name: string): Promise<void> {
    const ref = this.database.ref(`${this.p(FirebasePathsEnum.LOCKS)}/${name}`);
    try {
      await ref.transaction((current: any) => {
        if (current?.claimed_by === this.workerId) {
          return null; // remove lock
        }
        return; // não altera se não é o dono
      });
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        'releaseLock',
        LogAction.FAILED,
        { error, name },
      );
    }
  }

  // Método para deletar registro
  async deleteRecord(path: FirebasePathsEnum, id: string): Promise<void> {
    try {
      const ref = this.database.ref(`${this.p(path)}/${id}`);
      await ref.remove();
    } catch (error) {
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.deleteRecord.name,
        LogAction.FAILED,
        { error, path, id },
      );
      throw error;
    }
  }
}
