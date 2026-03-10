# Prompt Arena

This is a full-stack corporate activation project.

## Structure
- `api/`: Fastify backend + Prisma ORM
- `web/`: Next.js frontend + Tailwind CSS

## Getting Started

### Backend (API)
1. Go to `api/`
2. Update `.env` with your actual Supabase password.
3. Run migrations: `npx prisma migrate dev --name init`
4. Start dev server: `npm run dev` (runs on port 4000)

#### Reference image (prod/Vercel)
The API reads a local reference image (`api/src/test1.png`) to generate the initial AI prompt. On Vercel/serverless, make sure the file is included in the function bundle (this repo copies it to `api/dist/test1.png` on build and also includes it via `api/vercel.json`). You can override the location with `REFERENCE_IMAGE_PATH` or change the filename with `REFERENCE_IMAGE_FILE`.

### Frontend (Web)
1. Go to `web/`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev` (runs on port 3000)

## Endpoints / Pages
- **API Health:** `GET http://localhost:4000/health`
- **Frontend Screen:** `http://localhost:3000/screen`
- **Frontend Play:** `http://localhost:3000/play/[eventId]`
- **Frontend Admin:** `http://localhost:3000/admin`
