# RAS Site Safety

Daily job site safety checklists for Ron Anderson & Sons Ltd. Framers submit safety forms and admins review them.

See [`docs/requirements.md`](docs/requirements.md) and the [ERD](docs/erd.png).

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + shadcn
- React Hook Form + Zod for forms
- Supabase (auth + Postgres)
- Deployed on Vercel

## Setup

Requires Docker (for local Supabase).

```bash
npm install
npm run db:start              # local Supabase, migrated and seeded
cp .env.example .env.local    # set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from `npx supabase status`
npm run db:demo               # optional: two weeks of demo forms for the dashboards
npm run dev
```

Open http://localhost:3000 and sign in with a seeded account (password `password123` for all):

- Framer: `framer@ras.test` (also `priya.sandhu@`, `tom.bergstrom@`, `mei.chen@`)
- Admin: `admin@ras.test` (also `dana.whitfield@`)

### Tests

With Supabase running:

- `npm test`: unit tests, component tests (jsdom) and integration tests against the local database
- `npm run test:db`: the database RLS tests. These expect no forms in the database, so run `npm run db:reset` first if you've loaded demo data

### Scripts

Also available as VS Code tasks (`Terminal → Run Task`).

- `node scripts/dev.mjs`: installs dependencies if needed, then starts the dev server
- `npm run db:demo`: adds demo forms (with photos and some reviews) through the same path the app uses. Run `npm run db:reset` first for a clean slate
- `npm run diagrams`: renders `docs/**/*.mmd` to PNG. On Ubuntu, add a gitignored `docs/puppeteer-config.json` containing `{ "args": ["--no-sandbox"] }`

## Assumptions

- Admins cannot fill in new safety forms, they are only responsible for reviewing them
- There is no self sign-up - accounts are created in Supabase (dashboard or admin API)
- A user's role comes from `role` in their `app_metadata` (`framer` if unset), which only the admin API or SQL can change. Changing it updates their profile
- Submissions grow into the tens of thousands, so lists are paged 25 at a time with numbered pages (`?page=`, kept alongside the filters). Offset paging with an exact count stays fast at that size; job sites and workers stay small enough to load whole

## Project structure

```
src/
  app/              # routes and layouts only; keep these thin
    login/
    (app)/          # signed-in pages: home/dashboard, submissions, job sites
  features/         # feature modules (components, actions, data, schemas per feature)
    auth/
    safety-forms/
    job-sites/
    dashboard/
  components/       # app-wide components (header, page header, date picker, ...)
    ui/             # shadcn/ui primitives
  lib/              # shared utilities (dates, fonts, cn, ...)
    supabase/       # Supabase clients and generated database types
supabase/
  migrations/       # schema, RLS policies and storage bucket
  seed.sql          # local demo data (job sites, framer and admin logins)
  config.toml       # local Supabase settings
scripts/            # dev and diagram helpers
docs/               # requirements and ERD
public/brand/       # RAS logos
```

