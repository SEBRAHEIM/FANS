# FANS - Aviation Training Management System

Production-ready Next.js application built for managing ATCO trainings, sessions, and assessments.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend/Auth**: Supabase
- **Database**: PostgreSQL with RLS

## Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase Account

### 2. Environment Setup
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials.

### 3. Database Initialization
Run the SQL migration found in `supabase/migrations/20260131000000_init.sql` in your Supabase SQL Editor.

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## Role-Based Access

The system supports three main roles:
1. **ATCO**: View assigned trainings and complete assessments.
2. **Instructor**: Manage sessions and track student progress.
3. **HeadOfTraining (Admin)**: Full system oversight, course management, and auditing.

## Architecture

- `src/app/auth`: Server actions for login/logout.
- `src/app/api`: Cron endpoints for reminders.
- `src/lib/supabase`: Supabase clients for different contexts (browser, server, middleware).
- `src/middleware.ts`: Session management and route protection.
```
