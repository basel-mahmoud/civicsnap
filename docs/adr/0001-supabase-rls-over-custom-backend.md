# ADR 0001 — Supabase + RLS instead of a custom backend

- **Status:** Accepted
- **Context:** CivicSnap needs auth, a database, file storage, realtime, and an API
  surface, built by a small team and kept genuinely secure.
- **Decision:** Use Supabase (Postgres + RLS + Storage + Realtime) and push
  authorization into the database via Row Level Security rather than building and
  securing a bespoke API tier.
- **Consequences:**
  - (+) One enforcement point for authz; the browser holds only the public anon key.
  - (+) Less code to own and audit; managed TLS, backups, encryption at rest.
  - (−) Logic that doesn't fit RLS (e.g. server-only secrets) must live in edge functions.
