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

## Git history

Merge commits connect the original histories to `master` and preserve the original commit hashes. The branches available in the source checkouts are under `archive/api/`, `archive/vision/`, and `archive/frontend/`. Use those branches to inspect changes under their original paths.
