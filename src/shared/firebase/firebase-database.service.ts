import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin'; // Importar o Admin SDK
import { FirebasePathsEnum } from './firebase.enum';
import {
  GetGoogleCloudCredential,
  GoogleCloudCredential,
} from '../google/resouces';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';

@Injectable()
export class FirebaseDatabaseService {
  public readonly database: admin.database.Database;

  constructor() {
    const keyFilename = GetGoogleCloudCredential(
      GoogleCloudCredential['seemidia-display-android-82d570aeef50.json'],
    );

    const serviceAccount = require(keyFilename);

    try {
      // Verifica se o app já foi inicializado para evitar erros em testes/recargas
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL:
            'https://seemidia-display-android-default-rtdb.firebaseio.com/',
        });
      }

      this.database = admin.database(); // Obtenha a referência ao Realtime Database
    } catch (error) {
      const about = 'Firebase Realtime Database initialization error';
      Log(
        LogType.ERROR,
        FirebaseDatabaseService.name,
        this.save.name,
        LogAction.FAILED,
        { about, error },
      );
      throw new Error(about);
    }
  }

  async save(path: FirebasePathsEnum, id: string, data: any): Promise<void> {
    try {
      // Use os métodos do Admin SDK para Realtime Database
      const deviceRef = this.database.ref(`${path}/${id}`);
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
}
