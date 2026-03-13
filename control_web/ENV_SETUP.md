# Control Web: Environment Setup

`control_web` expects these environment variables for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Local development

Create a file named `.env.local` inside `control_web/` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then run:

```bash
npm install
npm run dev
```

## CI / Production

Set the same variables in your hosting provider / GitHub Actions environment.

