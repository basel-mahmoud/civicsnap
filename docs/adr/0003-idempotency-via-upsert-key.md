# ADR 0003 — Idempotency via a per-reporter key + upsert

- **Status:** Accepted
- **Context:** Network retries, a dropped response, or a double-tap on "Submit" could
  create duplicate reports. Mutating API calls must be safe to retry.
- **Decision:** Add `reports.idempotency_key` with a unique `(reporter_id, key)` index.
  The client generates one key per logical submission (reused across retries) and
  `upsert`s on that conflict target; a repeated key returns the existing row.
- **Consequences:**
  - (+) Retries and double-submits are safe; enables retry-with-backoff.
  - (+) No distributed lock or external store needed; the DB enforces correctness.
  - (−) Clients must supply a stable key; documented in the data-access layer.
