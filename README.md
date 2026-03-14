# Fund Intelligence MVP (Next.js + Supabase)

Starter implementation aligned to the project plan and SRS endpoint groups.

## Included
- Next.js App Router + TypeScript + Tailwind
- Supabase SSR auth/session setup
- Protected app routes (`/dashboard`, `/portal`)
- Login flow (`/login`) with server actions
- API groups:
  - `/api/auth`
  - `/api/users`
  - `/api/funds`
  - `/api/investors`
  - `/api/portfolio-companies`
  - `/api/investments`
  - `/api/valuations`
  - `/api/capital-calls`
  - `/api/documents`
  - `/api/reports`
  - `/api/performance`
  - `/api/notifications`
- Supabase SQL migration with schema + constraints + RLS:
  - `supabase/migrations/20260314113000_init_mvp.sql`

## Setup
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials
3. Run `npm install`
4. Run `npm run dev`

## Notes
- API routes expect fund context in header: `x-fund-id: <uuid>`
- Financial routes enforce basic validation rules from the project plan
- This is baseline MVP scaffolding; next step is feature-complete UI screens and background jobs
# privateinfointelligence
