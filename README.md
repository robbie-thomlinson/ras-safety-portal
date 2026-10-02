# RAS Site Safety

Daily job site safety checklists for Ron Anderson & Sons Ltd. Farmers submit checklists; admins review them.

See [`docs/requirements.md`](docs/requirements.md) and the [ERD](docs/erd.png).

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix)
- React Hook Form + Zod for forms
- Supabase (auth + Postgres), deployed on Vercel

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

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
public/brand/       # RAS logos
```

## Design tokens

Brand colors and fonts are taken from rasltd.ca and defined in `src/app/globals.css`.

- **Colors**: `brand-green-{50..950}` (RAS green is 700), `brand-charcoal`, `brand-paper`, `brand-amber`. Components should use the semantic shadcn tokens (`primary`, `muted`, `success`, `warning`, ...) instead.
- **Fonts** (by role): `font-heading` (Barlow Condensed, standing in for Gainsborough Sans) and `font-body` (Nunito Sans, standing in for Omnes Pro). `h1`–`h4` get the heading style automatically.
