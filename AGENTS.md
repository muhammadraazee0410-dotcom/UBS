# AGENTS.md

## Cursor Cloud specific instructions

This is a full-stack UBS Admin Portal with a **FastAPI backend** and a **React (CRACO) frontend**, using **MongoDB** as the database.

### Services

| Service | Port | Start command |
|---------|------|---------------|
| MongoDB | 27017 | `sudo mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork` |
| Backend (FastAPI) | 8001 | `cd backend && uvicorn server:app --host 0.0.0.0 --port 8001` |
| Frontend (React) | 3000 | `cd frontend && REACT_APP_BACKEND_URL=http://localhost:8001 PORT=3000 BROWSER=none yarn start` |

Start services in this order: MongoDB → Backend → Frontend.

### Environment variables

- Backend: reads from `backend/.env` (keys: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`).
- Frontend: reads from `frontend/.env` (key: `REACT_APP_BACKEND_URL`). Must point to the running backend (e.g., `http://localhost:8001`).

### Lint / Test / Build

- **Backend lint:** `cd backend && flake8 server.py --max-line-length=120` (pre-existing style violations exist in the repo).
- **Backend tests:** `cd backend && REACT_APP_BACKEND_URL=http://localhost:8001 python3 -m pytest tests/ -v` (requires MongoDB and backend running; 10 pre-existing test failures in the repo).
- **Frontend build:** `cd frontend && yarn build`
- **Frontend dev:** `cd frontend && yarn start`

### Gotchas

- The `emergentintegrations==0.1.0` package in `requirements.txt` is not available on PyPI. It is not imported in `server.py` so the backend runs fine without it. Install backend deps with: `pip install -r backend/requirements.txt 2>/dev/null || pip install $(grep -v emergentintegrations backend/requirements.txt | tr '\n' ' ')`.
- Default admin credentials: `admin@ubs.ch` / `UBS@2024`. The admin user is auto-created on first login attempt with these credentials.
- Python tools (`uvicorn`, `pytest`, `flake8`, `black`) install to `~/.local/bin` — ensure this is on `PATH`.
- Backend tests use `REACT_APP_BACKEND_URL` env var to find the running server (integration tests against a live instance, not unit tests).
- No lockfile exists for `yarn` — `yarn install` generates `yarn.lock` on first run.
