# AdaptaMídia

- `frontend/admin` contains the Next.js admin dashboard.
- `frontend/kiosk` contains the Flutter digital signage player for Android tablets.
- `backend/api` contains the NestJS API.
- `backend/vision` contains the Python computer vision service.

## Local development

Install Node.js 24, Java 21 for the Firebase emulator, MongoDB with `mongosh`, Redis, and `uv`. Run the launcher from the repository root.

```bash
./dev.sh --seed
```

The launcher creates missing local environment files and starts the admin dashboard at `http://127.0.0.1:4001/login`, the API on port `4002`, and the Vision service on port `8000`. The `--seed` option creates a demo account and display. Press `Ctrl+C` to stop the services started by the launcher.

The kiosk runs separately on an Android device or emulator. Its [setup instructions](frontend/kiosk/README.md) are in the app directory.

To store display camera captures in Firebase Storage, set `DISPLAY_CAPTURE_BUCKET` and `DISPLAY_CAPTURE_CREDENTIALS_FILE` in `backend/api/.env`. Use a private bucket and give the API service account permission to read and write objects there. The display player queues the frame with its playback log, and the API starts detection after the frame is stored. The admin dashboard uses time-limited signed URLs to show the images.

## Git history

Merge commits connect the original histories to `master` and preserve the original commit hashes. The branches available in the source checkouts are under `archive/api/`, `archive/vision/`, `archive/frontend/`, and `archive/kiosk/`. Use those branches to inspect changes under their original paths.

### Original repositories

| Component | Monorepo path | Original repository |
| --- | --- | --- |
| API | `backend/api` | [velrino/adaptamidia-api](https://github.com/velrino/adaptamidia-api) |
| Vision | `backend/vision` | [velrino/adaptamidia-vision](https://github.com/velrino/adaptamidia-vision) |
| Admin | `frontend/admin` | [velrino/alphamidia-admin](https://github.com/velrino/alphamidia-admin) |
| Kiosk | `frontend/kiosk` | [velrino/seemidia-app](https://github.com/velrino/seemidia-app) |
