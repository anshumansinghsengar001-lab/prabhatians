# PRABHATIANS

**Connect · Learn · Share** — a peer-learning platform for Prabhat Engineering College. Students can share skills, discover courses and creators, learn together, and track progress.

## Project layout

- `app/`, `components/`, `src/`, `public/` — Next.js + TypeScript responsive frontend with custom CSS.
- `backend/` — Express + TypeScript REST API, MongoDB/Mongoose models, JWT auth, role checks, seed data, and tests.

## Run locally

Requirements: Node.js 20+, MongoDB Community Server running locally, and npm.

Terminal 1 — API:

```powershell
cd backend
Copy-Item .env.example .env
# Edit backend/.env: set a private JWT_SECRET (16+ chars minimum).
npm install
npm run seed
npm run dev
```

Terminal 2 — frontend:

```powershell
npm install
# Root .env.example already points to http://localhost:5000/api; copy to .env.local if needed.
npm run dev
```

Open `http://localhost:3000`; API health is `http://localhost:5000/api/health`. Health returns 503 until the API can connect to MongoDB. Do not commit `.env` or `.env.local`.

### Demo accounts (development only)

- Student: `student@example.com` / `Student123!`
- Creator: `creator@example.com` / `Creator123!`
- Admin: `admin@example.com` / `Admin123!`

## Verify

Frontend (repository root): `npm run typecheck`, `npm run build`

Backend (`backend/`): `npm run typecheck`, `npm run build`, `npm test`

For MongoDB integration tests set `MONGODB_URI_TEST` to a separate disposable database before `npm test`.

## Deploy before sharing publicly

1. Push this full project to a GitHub repository. Include the root Next.js files and the `backend/` folder. Keep all `.env` files out of GitHub.
2. Deploy the root Next.js app to Vercel. Set `NEXT_PUBLIC_API_URL` to the deployed backend origin ending in `/api`.
3. Deploy the API from `backend/` on a Node host. Set `MONGODB_URI` to a MongoDB Atlas connection string, `JWT_SECRET` to a strong private value, `CLIENT_URL` to the exact Vercel site origin, and `NODE_ENV=production`.
4. Check `<API_URL>/health`, then run `npm run seed` from the backend against the configured database if you want demo content. Replace the development passwords before using real accounts.
5. Test the public website and API before sharing their URLs on LinkedIn. Localhost links only work on your own computer.

The backend video storage adapter currently uses local disk by default. A persistent/cloud storage adapter should be configured before relying on uploaded videos in a hosted production deployment.

