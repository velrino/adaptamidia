Env/Release separation: how to run and verify

Overview
- The app and API now respect an explicit environment flag (RELEASE or DEVELOP).
- The app enforces APP_ENV at startup and aborts if not provided.
- RTDB paths are prefixed with DEV_ when APP_ENV=DEVELOP to avoid mixing data.

Flutter app
- Required flag: --dart-define=APP_ENV=RELEASE|DEVELOP
- Run (develop):
  flutter run --dart-define=APP_ENV=DEVELOP
- Build release APK:
  flutter build apk --dart-define=APP_ENV=RELEASE

What APP_ENV affects in the app
- RTDB paths (via FirebasePaths.p):
  - AUTH_DEVICES -> DEV_AUTH_DEVICES (DEVELOP)
  - DISPLAY_LOGS -> DEV_DISPLAY_LOGS (DEVELOP)
  - DEVICES -> DEV_DEVICES (DEVELOP)
  - RELEASE -> DEV_RELEASE (DEVELOP)
  - LOCKS -> DEV_LOCKS (DEVELOP)
- Presence (DEVICES): includes APP_ENV field
- Crashlytics: sets custom key app_env
- App update: listens to RELEASE/DEV_RELEASE for OTA via APK URL

Validation in code
- lib/services/env_service.dart:
  - Env.appEnv reads APP_ENV
  - Env.validateOrThrow() enforces RELEASE|DEVELOP only
- lib/main.dart: calls Env.validateOrThrow() at startup

API (NestJS)
- Required environment variable: APP_ENV=RELEASE|DEVELOP (NODE_ENV also honored)
- Effects in api/src/shared/firebase/firebase-database.service.ts:
  - All RTDB refs use a helper p(path) that prefixes DEV_ when not RELEASE/PRODUCTION
- Example run:
  - DEVELOP: APP_ENV=DEVELOP npm run start:dev
  - RELEASE: APP_ENV=RELEASE node dist/main.js

Firebase RTDB rules (minimal mirror for DEV_)
{
  "rules": {
    "AUTH_DEVICES": { "$deviceId": { ".read": true, ".write": true } },
    "DEV_AUTH_DEVICES": { "$deviceId": { ".read": true, ".write": true } },

    "DISPLAY_LOGS": { ".read": true, ".write": true },
    "DEV_DISPLAY_LOGS": { ".read": true, ".write": true },

    "DEVICES": { "$deviceId": { ".read": true, ".write": true } },
    "DEV_DEVICES": { "$deviceId": { ".read": true, ".write": true } },

    "RELEASE": { ".read": true, ".write": true },
    "DEV_RELEASE": { ".read": true, ".write": true },

    "LOCKS": { ".read": false, ".write": true },
    "DEV_LOCKS": { ".read": false, ".write": true }
  }
}

How to verify quickly
- In RTDB, open DEVICES or DEV_DEVICES and confirm APP_ENV value.
- In Crashlytics, filter by custom key app_env.
- In app logs, ensure startup doesn’t throw (means APP_ENV is set properly).

