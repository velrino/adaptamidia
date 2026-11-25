# AdaptaMídia

- `frontend/admin` contains the Next.js admin dashboard. Additional frontend apps can live alongside it under `frontend`.
- `backend/api` contains the NestJS API.
- `backend/vision` contains the Python computer vision service.

## Local development

Install Node.js 24, Java 21 for the Firebase emulator, MongoDB with `mongosh`, Redis, and `uv`. Run the launcher from the repository root.

```bash
./dev.sh --seed
```

The launcher creates missing local environment files and starts the admin dashboard at `http://127.0.0.1:4001/login`, the API on port `4002`, and the Vision service on port `8000`. The `--seed` option creates a demo account and display. Press `Ctrl+C` to stop the services started by the launcher.

To store display camera captures in Firebase Storage, set `DISPLAY_CAPTURE_BUCKET` and `DISPLAY_CAPTURE_CREDENTIALS_FILE` in `backend/api/.env`. Use a private bucket and give the API service account permission to read and write objects there. The display player queues the frame with its playback log, and the API starts detection after the frame is stored. The admin dashboard uses time-limited signed URLs to show the images.

## Git history

Merge commits connect the original histories to `master` and preserve the original commit hashes. The branches available in the source checkouts are under `archive/api/`, `archive/vision/`, and `archive/frontend/`. Use those branches to inspect changes under their original paths.
