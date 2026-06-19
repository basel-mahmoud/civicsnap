// CivicSnap — AI photo classifier (Supabase Edge Function, Deno runtime)
//
// Receives a base64 image from an authenticated client, asks Claude vision to
// classify it into a civic-issue category + severity + title + description, and
// returns structured JSON. The ANTHROPIC_API_KEY lives only in this function's
// secrets and never reaches the browser.
//
// `verify_jwt` is enabled (default), so only signed-in users can call this.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const MODEL = Deno.env.get('CLASSIFY_MODEL') ?? 'claude-sonnet-4-6'

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

const CLASSIFY_TOOL = {
  name: 'report_classification',
  description: 'Record the classification of a civic-issue photo.',
  input_schema: {
    type: 'object',
    properties: {
      is_valid_issue: {
        type: 'boolean',
        description:
          'True only if the photo plausibly shows a real public/neighborhood issue (road, sidewalk, lighting, trash, graffiti, water, signage, etc). False for selfies, memes, indoor scenes, blank/abstract images.',
      },
      category: { type: 'string', enum: VALID_CATEGORIES },
      severity: {
        type: 'string',
        enum: VALID_SEVERITIES,
        description: 'low = cosmetic/minor, medium = should be fixed, high = safety hazard.',
      },
      title: {
        type: 'string',
        description: 'A short, specific title (max ~8 words), e.g. "Large pothole on crosswalk".',
      },
      description: {
        type: 'string',
        description: 'One or two factual sentences describing what is visible and why it matters.',
      },
      confidence: {
        type: 'number',
        description: 'Your confidence in this classification, 0 to 1.',
      },
    },
    required: ['is_valid_issue', 'category', 'severity', 'title', 'description', 'confidence'],
  },
} as const

const SYSTEM_PROMPT = `You are CivicSnap's triage assistant. You look at a single photo a resident took of a possible neighborhood problem and classify it for a municipal reporting system. Be objective and concise. Always call the report_classification tool exactly once. If the image is not a genuine civic issue, set is_valid_issue=false, category="other", and explain briefly in the description.`

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors)
  }
  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'Server not configured' }, 500, cors)
  }

  // Identify the caller from the verified JWT (sub claim) for rate limiting.
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
  if (image_base64.length > 7_000_000) {
    return json({ error: 'Image too large' }, 413, cors)
  }
  const mt = ['image/jpeg', 'image/png', 'image/webp'].includes(media_type ?? '')
    ? media_type!
    : 'image/jpeg'

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: 'tool', name: 'report_classification' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mt, data: image_base64 },
              },
              {
                type: 'text',
                text: 'Classify this photo for the civic reporting system.',
              },
            ],
          },
        ],
      }),
    })

    if (!resp.ok) {
      const detail = await resp.text()
      console.error('Anthropic error', resp.status, detail)
      return json({ error: 'AI service error' }, 502, cors)
    }

    const data = await resp.json()
    const toolUse = (data.content ?? []).find(
      (c: { type: string }) => c.type === 'tool_use',
    )
    if (!toolUse) {
      return json({ error: 'No classification produced' }, 502, cors)
    }

    const out = sanitize(toolUse.input)
    return json(out, 200, cors)
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
    const payload = JSON.parse(
      atob(part.replace(/-/g, '+').replace(/_/g, '/')),
    )
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
