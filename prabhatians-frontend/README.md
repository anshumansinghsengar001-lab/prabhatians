# PRABHATIANS frontend

A responsive Next.js frontend foundation for the Prabhat Engineering College peer-learning platform. The dashboard follows the supplied campus dashboard reference. It includes branding, a responsive sidebar/navigation, search entry point, dashboard panels, and login/signup screens.

## Run locally

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The UI can run without an API. Dashboard content stays in its empty/loading states until you connect an API. To connect a backend, copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_URL` to the API base URL (for example `http://localhost:5000/api`), then restart the dev server.

## Verify production build

```bash
npm run build
npm run start
```

## Deploy through GitHub and Vercel

1. Create a new GitHub repository and upload/push the contents of this folder to its root.
2. In Vercel, choose **Add New → Project**, import that GitHub repository, and keep the framework preset as **Next.js**.
3. Deploy. No environment variable is required for the frontend-only preview.
4. When the backend is ready, add `NEXT_PUBLIC_API_URL` in Vercel project settings and redeploy.

This deliverable contains the frontend only. Authentication screens and API client wiring are ready for a backend URL; actual login, course data, and saved content require the backend and database to be deployed separately.
