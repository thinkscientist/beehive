// Backend-for-frontend for the Agentic Field Lab site.
//
// Service credentials live here, never in the React bundle. The CUGA and Hive
// integrations are separate handlers and share nothing but the rate limiter.
// Upstream targets come only from environment variables, never from a request.

import crypto from 'node:crypto'
import http from 'node:http'

const MAX_BODY_BYTES = 16 * 1024
const MAX_MESSAGE_CHARS = 2000
const MAX_CONTEXT_CHARS = 6000
const MAX_EVENTS = 40
const MAX_EVENT_CHARS = 1500

class HttpError extends Error {
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

function trimBase(url) {
  return url ? url.replace(/\/+$/, '') : ''
}

export function readConfig(env) {
  return {
    cugaBase: trimBase(env.CUGA_BASE_URL),
    hiveBase: trimBase(env.HIVE_BASE_URL),
    hiveToken: env.HIVE_DASHBOARD_TOKEN || '',
    accessToken: env.BFF_ACCESS_TOKEN || '',
    ratePerMinute: Number(env.RATE_LIMIT_PER_MINUTE) || 20,
    trustProxy: env.TRUST_PROXY === '1',
  }
}

function createRateLimiter(limit, now) {
  const hits = new Map()
  let lastSweep = now()
  return (key) => {
    const cutoff = now() - 60_000
    // Drop keys with no recent hits so memory stays bounded by active clients.
    if (lastSweep <= cutoff) {
      for (const [k, times] of hits) {
        if (times.every((t) => t <= cutoff)) hits.delete(k)
      }
      lastSweep = now()
    }
    const recent = (hits.get(key) ?? []).filter((t) => t > cutoff)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(now())
    hits.set(key, recent)
    return true
  }
}

function safeEqual(a, b) {
  const hash = (v) => crypto.createHash('sha256').update(String(v)).digest()
  return crypto.timingSafeEqual(hash(a), hash(b))
}

function clientKey(req, trustProxy) {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded) {
      // A single trusted proxy appends the peer address, so the last entry is
      // the only one a client cannot choose.
      return forwarded.split(',').at(-1).trim()
    }
  }
  return req.socket.remoteAddress ?? 'unknown'
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'body_too_large')
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'invalid_json')
  }
}

/** Parse a text/event-stream body into `{ name, data }` events. */
export function parseSse(text) {
  return text
    .split(/\r?\n\r?\n/)
    .map((block) => {
      let name = 'message'
      const data = []
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) name = line.slice(6).trim()
        else if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''))
        }
      }
      return { name, data: data.join('\n') }
    })
    .filter((event) => event.data !== '')
}

function buildCugaQuery(message, pageContext) {
  return [
    'Answer the question using only the web page text below.',
    'If the page does not say, answer that it does not say.',
    '',
    '--- PAGE TEXT ---',
    pageContext,
    '--- END PAGE TEXT ---',
    '',
    `Question: ${message}`,
  ].join('\n')
}

async function probe(fetchImpl, url) {
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

async function handleStatus(config, fetchImpl) {
  const [cuga, hive] = await Promise.all([
    config.cugaBase ? probe(fetchImpl, `${config.cugaBase}/health`) : false,
    config.hiveBase ? probe(fetchImpl, `${config.hiveBase}/api/health`) : false,
  ])
  return {
    cugaApi: { configured: Boolean(config.cugaBase), reachable: cuga },
    hiveApi: { configured: Boolean(config.hiveBase), reachable: hive },
  }
}

async function handleCugaChat(config, fetchImpl, req) {
  if (!config.cugaBase) throw new HttpError(503, 'cuga_not_configured')
  const body = await readJson(req)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const pageContext =
    typeof body?.pageContext === 'string' ? body.pageContext : ''
  if (!message || message.length > MAX_MESSAGE_CHARS) {
    throw new HttpError(400, 'invalid_message')
  }
  if (!pageContext || pageContext.length > MAX_CONTEXT_CHARS) {
    throw new HttpError(400, 'invalid_page_context')
  }

  let res
  try {
    res = await fetchImpl(`${config.cugaBase}/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: buildCugaQuery(message, pageContext) }),
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    throw new HttpError(502, 'cuga_unreachable')
  }
  if (!res.ok) throw new HttpError(502, 'cuga_error')

  // Look for Error and Answer on the full stream: CUGA emits both at the end,
  // so truncating first would drop them on long runs.
  const parsed = parseSse(await res.text())
  if (parsed.some((e) => e.name === 'Error')) {
    throw new HttpError(502, 'cuga_run_failed')
  }
  const answer = parsed.findLast((e) => e.name === 'Answer')?.data ?? ''
  const events = parsed
    .slice(0, MAX_EVENTS)
    .map((e) => ({ name: e.name, data: e.data.slice(0, MAX_EVENT_CHARS) }))
  return { answer, events }
}

async function handleHiveRuns(config, fetchImpl) {
  if (!config.hiveBase) throw new HttpError(503, 'hive_not_configured')
  let res
  try {
    res = await fetchImpl(`${config.hiveBase}/api/runs`, {
      headers: config.hiveToken
        ? { authorization: `Bearer ${config.hiveToken}` }
        : {},
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new HttpError(502, 'hive_unreachable')
  }
  if (res.status === 401 || res.status === 403) {
    throw new HttpError(502, 'hive_auth_failed')
  }
  if (!res.ok) throw new HttpError(502, 'hive_error')
  const runs = await res.json().catch(() => null)
  if (!Array.isArray(runs)) throw new HttpError(502, 'hive_error')
  // Pass through only the documented Run fields the UI renders.
  return {
    runs: runs.map((run) => ({
      key: String(run.key ?? ''),
      title: String(run.title ?? ''),
      repo: String(run.repo ?? ''),
      stage: String(run.stage ?? ''),
      waitingOn: String(run.waiting_on ?? 'none'),
      assignee: run.assignee ? String(run.assignee) : null,
    })),
  }
}

export function createHandler({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  const config = readConfig(env)
  const allow = createRateLimiter(config.ratePerMinute, now)

  return async (req, res) => {
    const send = (status, payload) => {
      res.writeHead(status, {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      })
      res.end(JSON.stringify(payload))
    }
    try {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost')
      if (!allow(clientKey(req, config.trustProxy))) {
        throw new HttpError(429, 'rate_limited')
      }
      if (
        config.accessToken &&
        !safeEqual(req.headers['x-access-token'] ?? '', config.accessToken)
      ) {
        throw new HttpError(401, 'unauthorized')
      }
      if (req.method === 'GET' && pathname === '/api/status') {
        return send(200, await handleStatus(config, fetchImpl))
      }
      if (req.method === 'POST' && pathname === '/api/cuga/chat') {
        return send(200, await handleCugaChat(config, fetchImpl, req))
      }
      if (req.method === 'GET' && pathname === '/api/hive/runs') {
        return send(200, await handleHiveRuns(config, fetchImpl))
      }
      throw new HttpError(404, 'not_found')
    } catch (error) {
      if (error instanceof HttpError) {
        return send(error.status, { error: error.code })
      }
      // Never expose stack traces or upstream details to the browser.
      return send(500, { error: 'internal_error' })
    }
  }
}

export function startServer(env = process.env) {
  const port = Number(env.PORT) || 8787
  const host = env.HOST || '127.0.0.1'
  const server = http.createServer(createHandler({ env }))
  server.listen(port, host, () => {
    console.log(`Agentic Field Lab server listening on http://${host}:${port}`)
  })
  return server
}
