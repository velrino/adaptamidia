import { join } from 'path';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';

export enum GoogleCloudCredential {
  'rare-tape-466414-f4-a4a31231b9e1.json' = 'rare-tape-466414-f4-a4a31231b9e1.json',
  'ethereal-yen-469818-g9-8e2736264211.json' = 'ethereal-yen-469818-g9-8e2736264211.json',
  'seemidia-display-android-82d570aeef50.json' = 'seemidia-display-android-82d570aeef50.json',
}

export const GetGoogleCloudCredential = (fileName: GoogleCloudCredential) => {
  const dirs = ['dist', 'resources'];
  const keyFilename = join(process.cwd(), 'resources', fileName);

  Log(LogType.INFO, GetGoogleCloudCredential.name, 'exec', LogAction.STARTED, {
    keyFilename,
  });

  if (!keyFilename) {
    const error = `NOT_FOUND = ${fileName} in [${dirs.join(', ')}]`;
    Log(
      LogType.ERROR,
      GetGoogleCloudCredential.name,
      'exec',
      LogAction.FAILED,
      { keyFilename, error },
    );
    throw new Error(error);
  }

  return keyFilename;
};
