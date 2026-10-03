# RAS Site Safety

Daily job site safety checklists for Ron Anderson & Sons Ltd. Farmers submit safety forms and admins review them.

See [`docs/requirements.md`](docs/requirements.md) and the [ERD](docs/erd.png).

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + shadcn
- React Hook Form + Zod for forms
- Supabase (auth + Postgres)
- Deployed on Vercel

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Scripts

Also available as VS Code tasks (`Terminal → Run Task`).

- `node scripts/dev.mjs`: installs dependencies if needed, then starts the dev server
- `npm run diagrams`: renders `docs/**/*.mmd` to PNG. On Ubuntu, add a gitignored `docs/puppeteer-config.json` containing `{ "args": ["--no-sandbox"] }`

## Assumptions

- Admins cannot fill in new safety forms, they are only responsible for reviewing them
- There is no self sign-up - accounts are created in Supabase (dashboard or admin API)

## Project structure

```
src/
  app/              # routes and layouts only; keep these thin
  features/         # feature modules (components, actions, schemas per feature)
    auth/
    safety-forms/
    dashboard/
  components/ui/    # shadcn/ui primitives
  lib/              # shared utilities (fonts, cn, ...)
    supabase/       # Supabase clients and generated database types
supabase/
  migrations/       # schema, RLS policies and storage bucket
  seed.sql          # local demo data (job sites, farmer and admin logins)
  config.toml       # local Supabase settings
scripts/            # dev and diagram helpers
docs/               # requirements and ERD
public/brand/       # RAS logos
```

