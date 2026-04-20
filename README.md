# VertexSpace Frontend

React + Vite frontend for VertexSpace.

## Environment setup

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

For Vercel production, set `VITE_API_BASE_URL` in your Vercel project environment variables to your backend URL.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Vercel

1. Import this repository into Vercel.
2. Keep default build settings or use:
	- Build Command: `npm run build`
	- Output Directory: `dist`
3. Add environment variable:
	- `VITE_API_BASE_URL=https://your-backend-domain`
4. Deploy.

SPA rewrites are configured in `vercel.json` so React Router routes work on refresh and direct URL access.
