MY AI CAREER COACH

An AI-powered career coaching application with tools for profile management,
resume and cover-letter generation, resume importing, and interview practice.

TECH STACK

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, Radix UI
- Backend: NestJS 11, TypeScript, Prisma
- Database: PostgreSQL
- AI: Google Gemini

PROJECT STRUCTURE

- frontend/   Next.js web application
- backend/    NestJS API and Prisma data model

REQUIREMENTS

- Node.js 20.16 or newer
- npm
- PostgreSQL
- Google Gemini API key

SETUP

1. Install dependencies:

   cd backend
   npm install

   cd ../frontend
   npm install

2. Configure the backend:

   Copy backend/.env.example to backend/.env and set:

   DATABASE_URL
   PORT
   JWT_ACCESS_SECRET
   JWT_ACCESS_EXPIRY
   JWT_REFRESH_SECRET
   JWT_REFRESH_EXPIRY
   FRONTEND_URL
   GEMINI_API_KEY
   GEMINI_MODEL

3. Configure the frontend:

   Copy frontend/.env.example to frontend/.env.local and set:

   NEXT_PUBLIC_API_URL=http://localhost:3001

4. Prepare the database from the backend directory:

   npx prisma generate
   npx prisma migrate dev

RUN LOCALLY

Start the backend:

   cd backend
   npm run start:dev

Start the frontend in another terminal:

   cd frontend
   npm run dev

Open http://localhost:3000. The API runs on http://localhost:3001 by default.

USEFUL COMMANDS

Frontend:

   npm run dev
   npm run build
   npm run start

Backend:

   npm run start:dev
   npm run build
   npm run test
   npm run test:e2e

SECURITY

Do not commit backend/.env, frontend/.env.local, database credentials, JWT
secrets, or API keys.
