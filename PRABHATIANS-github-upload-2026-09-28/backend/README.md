# PRABHATIANS API

Node.js, Express, TypeScript, MongoDB/Mongoose API for the PRABHATIANS peer-learning platform.

## Run locally

Requirements: Node.js 20+ and a reachable MongoDB instance (MongoDB Community Server or MongoDB Atlas).

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

Set `MONGODB_URI` and replace `JWT_SECRET` in `backend/.env`. The API listens at `http://localhost:5000/api`; health is `GET http://localhost:5000/api/health`.

The server starts its HTTP listener even if MongoDB is unavailable so `/api/health` can report the state. It returns HTTP 503 and does not serve database-backed routes until the real MongoDB connection is ready. It never reports a fake successful connection.

### MongoDB options

- Local MongoDB: install MongoDB Community Server, start its Windows service, then use the example URI `mongodb://127.0.0.1:27017/prabhatians`.
- MongoDB Atlas: create a cluster and database user, allow your development/deployment IP in Network Access, then put the Atlas connection string in `MONGODB_URI`. Keep credentials private and URL-encode special characters in the password.

When using a deployed frontend, set `CLIENT_URL` to its exact origin (for example `https://your-site.vercel.app`) so CORS allows it. Set `NEXT_PUBLIC_API_URL` on the frontend to the API base URL ending in `/api`.

## Seed development data

After MongoDB is running and `.env` is configured:

```powershell
npm run seed
```

Seed is repeatable and does not clear the database. It creates student, creator, and admin users, profiles, categories, skills, a course with modules and lessons, a video, a note, a quiz with questions, comments, ratings, reviews, an enrollment, and a connection.

Development-only demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@example.com` | `Student123!` |
| Creator | `creator@example.com` | `Creator123!` |
| Admin | `admin@example.com` | `Admin123!` |

Do not use these demo credentials in production.

## Checks

```powershell
npm run typecheck
npm run build
npm test
```

Database integration tests run when `MONGODB_URI_TEST` points to a separate, disposable test database. Without it, the suite verifies API health/degraded behavior and clear database connection failures, then skips the MongoDB CRUD integration test. Do not point `MONGODB_URI_TEST` at a real or production database.

## Video storage

Video metadata is stored in MongoDB; video bytes are stored outside MongoDB. The local provider writes to `VIDEO_STORAGE_PATH`. Set `VIDEO_STORAGE_PROVIDER=mock` for a metadata-only adapter in development/tests. `VideoStorage` is the interface to replace with Cloudinary, S3, or R2 later.

## Implemented API areas

Authentication, users/profiles/follows, skills/matches, categories, courses/modules/lessons/enrollment, video and note metadata/uploads, quizzes/submissions, comments/replies/likes/reports, ratings/reviews, search/recommendations, progress, connections, conversations/messages, saved content, notifications, creator applications/dashboard, moderation/admin endpoints, and reports.
