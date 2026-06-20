// CivicSnap — AI photo classifier (Supabase Edge Function, Deno runtime)
//
// Uses Google Gemini Flash (free tier) vision to classify a base64 image into a
// civic-issue category + severity + title + description, returned as structured
// JSON via Gemini's responseSchema. The GEMINI_API_KEY lives only in this
// function's secrets and never reaches the browser.
//
// `verify_jwt` is enabled, so only signed-in users can call this.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const MODEL = Deno.env.get('CLASSIFY_MODEL') ?? 'gemini-2.0-flash'

const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https:\/\/([a-z0-9-]+\.)*civicsnap[a-z0-9-]*\.vercel\.app$/,
  /^https:\/\/civicsnap[a-z0-9-]*\.vercel\.app$/,
]

const VALID_CATEGORIES = [
  'pothole', 'streetlight', 'graffiti', 'trash', 'water', 'sign', 'sidewalk', 'other',
] as const
const VALID_SEVERITIES = ['low', 'medium', 'high'] as const

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.some((re) => re.test(origin)) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowed || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

// Best-effort in-memory rate limit (per warm instance): 20 calls / user / 5 min.
const RATE_WINDOW_MS = 5 * 60_000
const RATE_MAX = 20
const hits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  arr.push(now)
  hits.set(key, arr)
  return arr.length > RATE_MAX
}

// Gemini structured-output schema → guarantees parseable, constrained JSON.
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_valid_issue: { type: 'BOOLEAN' },
    category: { type: 'STRING', enum: VALID_CATEGORIES },
    severity: { type: 'STRING', enum: VALID_SEVERITIES },
    title: { type: 'STRING' },
    description: { type: 'STRING' },
    confidence: { type: 'NUMBER' },
  },
  required: ['is_valid_issue', 'category', 'severity', 'title', 'description', 'confidence'],
}

const PROMPT = `You are CivicSnap's triage assistant. Look at this single photo a resident took of a possible neighborhood problem and classify it for a municipal reporting system.
- is_valid_issue: true only if it plausibly shows a real public/neighborhood issue (road, sidewalk, lighting, trash, graffiti, water, signage, etc). False for selfies, memes, indoor scenes, blank/abstract images.
- category: the best-fit class.
- severity: low = cosmetic/minor, medium = should be fixed, high = safety hazard.
- title: a short specific title (max ~8 words), e.g. "Large pothole on crosswalk".
- description: one or two factual sentences on what is visible and why it matters.
- confidence: your confidence 0 to 1.
If it is not a genuine civic issue, set is_valid_issue=false and category="other".`

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)
  if (!GEMINI_API_KEY) return json({ error: 'Server not configured' }, 500, cors)

  const auth = req.headers.get('authorization') ?? ''
  const userKey = subFromJwt(auth) ?? 'anon'
  if (rateLimited(userKey)) {
    return json({ error: 'Rate limit exceeded. Try again in a few minutes.' }, 429, cors)
  }

  let body: { image_base64?: string; media_type?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, cors)
  }

  const { image_base64, media_type } = body
  if (!image_base64 || typeof image_base64 !== 'string') {
    return json({ error: 'image_base64 is required' }, 400, cors)
  }
  if (image_base64.length > 7_000_000) return json({ error: 'Image too large' }, 413, cors)
  const mt = ['image/jpeg', 'image/png', 'image/webp'].includes(media_type ?? '')
    ? media_type!
    : 'image/jpeg'

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: mt, data: image_base64 } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    })

    if (!resp.ok) {
      console.error('Gemini error', resp.status, await resp.text())
      return json({ error: 'AI service error' }, 502, cors)
    }

    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return json({ error: 'No classification produced' }, 502, cors)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      return json({ error: 'Bad AI response' }, 502, cors)
    }
    return json(sanitize(parsed), 200, cors)
  } catch (err) {
    console.error('classify-photo failure', err)
    return json({ error: 'Unexpected error' }, 500, cors)
  }
})

function sanitize(input: Record<string, unknown>) {
  const category = VALID_CATEGORIES.includes(input.category as never)
    ? (input.category as string)
    : 'other'
  const severity = VALID_SEVERITIES.includes(input.severity as never)
    ? (input.severity as string)
    : 'medium'
  const confidence = Math.max(0, Math.min(1, Number(input.confidence) || 0))
  return {
    is_valid_issue: Boolean(input.is_valid_issue),
    category,
    severity,
    title: String(input.title ?? 'Reported issue').slice(0, 140),
    description: String(input.description ?? '').slice(0, 2000),
    confidence: Math.round(confidence * 100) / 100,
  }
}

function subFromJwt(authHeader: string): string | null {
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}
