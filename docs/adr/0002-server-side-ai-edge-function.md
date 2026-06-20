# ADR 0002 — Server-side AI in a Supabase Edge Function

- **Status:** Accepted
- **Context:** Photo classification uses the Anthropic API, which requires a secret
  key. That key must never reach the browser, and model output must be trusted.
- **Decision:** Run classification in the `classify-photo` edge function. It holds the
  `ANTHROPIC_API_KEY` as a function secret, requires a verified JWT, rate-limits per
  user, and constrains the model with tool-use + an allow-list before returning.
- **Consequences:**
  - (+) Secret stays server-side; output is validated; abuse is bounded.
  - (+) The client degrades gracefully to manual entry when the function is unavailable.
  - (−) An extra deploy artifact (the function) to version and ship.
