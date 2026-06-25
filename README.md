# Hands Off — AI Civilization Broker

> **We didn't build an agent. We built a company.**

## Quick Start (zero dashboard setup)

```bash
cp .env.example .env.local
# Add your API keys (see below)
npm install
npm run dev
```

Open http://localhost:3000 → **Start Company**. Done.

Supabase **auto-creates** its storage bucket on first run. No SQL Editor, no migrations.

## Env vars

| Variable | Where |
|----------|--------|
| `MANUS_API_KEY` | [manus.im](https://manus.im) → API Integration |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key |

Without keys the app still runs (local `.data/state.json` fallback).

## What happens on `npm run dev`

1. Server starts, loads or creates civilization state
2. Supabase Storage bucket `hands-off` auto-created if missing
3. State saved to cloud + local file on every tick
4. Manus AI writes agent pitches and project deliverables

## Demo

1. Press **Start Company**
2. Watch Overview + Activity feed evolve
3. **Agents** tab — roles emerge
4. **Projects** tab — Manus deliverables
5. *"We didn't build an agent. We built a company."*

---

Built for the **Hands Off** hackathon.
