# My AI Career Coach

An AI-powered career coaching platform that helps users manage their professional profile, build resumes and cover letters, import existing resumes, and practice technical and behavioral interviews with AI.

**Live site:** https://my-ai-carrer-coach-five.vercel.app

## Features

* Professional profile management
* AI-powered resume generation
* Resume importing
* AI-generated cover letters
* Interview preparation and practice
* Personalized AI career assistance
* Secure authentication with access and refresh tokens
* Persistent user data with PostgreSQL

## Tech Stack

### Frontend

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* Radix UI

### Backend

* NestJS 11
* TypeScript
* Prisma ORM
* REST API
* JWT authentication

### Database

* PostgreSQL

### AI

* Google Gemini

## Architecture

The project is separated into two applications:

```text
.
├── frontend/    # Next.js web application
└── backend/     # NestJS API and Prisma data model
```

The Next.js frontend communicates with the NestJS backend through a REST API.

The backend handles authentication, application logic, database access, and communication with Google Gemini.

```text
Browser
   │
   ▼
Next.js Frontend
   │
   │ REST API
   ▼
NestJS Backend
   │
   ├── PostgreSQL / Prisma
   │
   └── Google Gemini API
```

## Requirements

* Node.js 20.16 or newer
* npm
* PostgreSQL
* Google Gemini API key

## Setup

### 1. Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 2. Configure the Backend

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

Configure the following environment variables:

```env
DATABASE_URL=
PORT=
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRY=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRY=
FRONTEND_URL=
GEMINI_API_KEY=
GEMINI_MODEL=
```

For local development, the backend normally runs on port `3001`.

### 3. Configure the Frontend

Copy the frontend environment configuration:

```bash
cd frontend
cp .env.example .env.local
```

Set the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Prepare the Database

From the backend directory:

```bash
npx prisma generate
npx prisma migrate dev
```

## Run Locally

Start the backend:

```bash
cd backend
npm run start:dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend at:

```text
http://localhost:3000
```

The backend API runs at:

```text
http://localhost:3001
```

## Useful Commands

### Frontend

```bash
npm run dev
npm run build
npm run start
```

### Backend

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

## Deployment

The production frontend is deployed on Vercel.

**Production:** https://my-ai-carrer-coach-five.vercel.app

The production frontend communicates with the deployed NestJS API through the `NEXT_PUBLIC_API_URL` environment variable.

Production credentials, database URLs, JWT secrets, and Gemini API keys are configured through environment variables and are not stored in the repository.

## Security

Sensitive configuration must never be committed to the repository.

This includes:

* `backend/.env`
* `frontend/.env.local`
* PostgreSQL credentials
* JWT access and refresh secrets
* Google Gemini API keys

Environment variable example files should contain only placeholder values and documentation required to run the project locally.

## Production Build

Build the frontend:

```bash
cd frontend
npm run build
```

Build the backend:

```bash
cd backend
npm run build
```
