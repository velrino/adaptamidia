export enum FirebasePathsEnum {
  AUTH_DEVICES = 'AUTH_DEVICES',
  DISPLAY_LOGS = 'DISPLAY_LOGS',
}

export interface IFirebaseListenForNewRecords {
  path: FirebasePathsEnum;
  callback: (data: any, key: string) => Promise<void>;
  // delete_after_get: boolean;
}
