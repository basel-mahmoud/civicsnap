# CivicSnap 📍

**Snap a photo of a neighborhood problem — AI categorizes it, pins it on a public map, and tracks it to "Fixed."**

**🔗 Live demo: https://civicsnap-one.vercel.app**

CivicSnap turns civic reporting into a 20-second action. Residents photograph an issue
(pothole, broken street light, illegal dumping, graffiti…); Claude vision reads the image,
assigns a category and severity, and writes a clear title. The report drops a pin on a
shared map and moves through a transparent status pipeline — `Reported → Acknowledged →
In progress → Fixed` — that anyone can follow.

> Built end-to-end as a portfolio project: AI vision, geospatial mapping, realtime data,
> row-level security, and a production deploy.

## Tech stack

| Layer        | Choice                                                          |
| ------------ | -------------------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite, Tailwind CSS v4                    |
| Maps         | Leaflet + OpenStreetMap (no API key required)                  |
| Backend      | Supabase — Postgres, Row Level Security, Realtime, Storage     |
| Auth         | Supabase Auth (email/password)                                 |
| AI           | Claude vision (Anthropic) via a Supabase Edge Function         |
| Hosting      | Vercel                                                         |

## Architecture highlights

- **AI stays server-side.** Photo classification runs in a Supabase Edge Function so the
  `ANTHROPIC_API_KEY` never reaches the browser.
- **Security by default.** Every table is protected by Row Level Security: the public can
  read reports, only authenticated users can create them, only owners can edit their own,
  and only admins can change status.
- **Realtime map.** New and updated reports stream to every connected client.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

## Project status

Live in production on Vercel, backed by Supabase (Postgres + RLS + Storage + Realtime
+ an Edge Function for Claude vision). Built in staged commits — see the history.

To enable AI photo classification, set an `ANTHROPIC_API_KEY` secret on the
`classify-photo` edge function; without it the app falls back to manual entry.
