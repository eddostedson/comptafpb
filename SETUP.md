# CGCS - Setup Guide

## Project Overview
This is a full-stack application for "Comptabilité de Gestion des Centres de Santé" (CGCS) with:
- **Frontend**: Next.js 15 with React 19 (runs on port 3975)
- **Backend**: NestJS with Prisma (runs on port 3001)
- **Database**: PostgreSQL

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set up Environment Variables

#### Frontend (.env.local)
Copy `frontend/env.example` to `frontend/.env.local`:
```bash
cp frontend/env.example frontend/.env.local
```

#### Backend (.env)
Copy `backend/env.example` to `backend/.env`:
```bash
cp backend/env.example backend/.env
```

### 3. Database Setup
Make sure PostgreSQL is running on port 5432 with:
- Database: `cgcs_db`
- User: `cgcs_user`
- Password: `cgcs_password_2024`

### 4. Run the Application

#### Option A: Run Everything (Recommended)
```bash
pnpm dev
```

#### Option B: Run Services Separately
```bash
# Terminal 1 - Backend
pnpm dev:backend

# Terminal 2 - Frontend
pnpm dev:frontend
```

#### Option C: Using Docker
```bash
docker-compose up
```

## Available Scripts

- `pnpm dev` - Run both frontend and backend in development mode
- `pnpm dev:frontend` - Run only the frontend
- `pnpm dev:backend` - Run only the backend
- `pnpm build` - Build both applications
- `pnpm start` - Run both applications in production mode
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio

## Ports
- Frontend: http://localhost:3975
- Backend API: http://localhost:3001
- Database: localhost:5432

## Troubleshooting

### Frontend not starting
1. Check if port 3975 is available
2. Ensure environment variables are set correctly
3. Check if backend is running on port 3001

### Backend not starting
1. Check if PostgreSQL is running
2. Ensure database credentials are correct
3. Run `pnpm prisma:generate` and `pnpm prisma:migrate`

### Database connection issues
1. Verify PostgreSQL is running
2. Check database credentials in environment variables
3. Ensure database `cgcs_db` exists









