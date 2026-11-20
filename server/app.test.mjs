import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { createHandler, parseSse } from './app.mjs'

function call(handler, { method = 'GET', url = '/', headers = {}, body } = {}) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = headers
  req.socket = { remoteAddress: '1.2.3.4' }
  req[Symbol.asyncIterator] = async function* () {
    if (body !== undefined) yield Buffer.from(body)
  }
  return new Promise((resolve) => {
    const res = {
      writeHead(status) {
        this.status = status
      },
      end(payload) {
        resolve({ status: this.status, body: JSON.parse(payload) })
      },
    }
    handler(req, res)
  })
}

const okJson = (body) => new Response(JSON.stringify(body), { status: 200 })

describe('parseSse', () => {
  it('parses named events with multi-line data', () => {
    const events = parseSse(
      'event: Answer\ndata: a\ndata: b\n\nevent: X\ndata: 1\n\n',
    )
    expect(events).toEqual([
      { name: 'Answer', data: 'a\nb' },
      { name: 'X', data: '1' },
    ])
  })
})

describe('server', () => {
  it('reports unconfigured services without calling out', async () => {
    const fetchImpl = vi.fn()
    const handler = createHandler({ env: {}, fetchImpl })
    const { status, body } = await call(handler, { url: '/api/status' })
    expect(status).toBe(200)
    expect(body.cugaApi).toEqual({ configured: false, reachable: false })
    expect(body.hiveApi).toEqual({ configured: false, reachable: false })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reports reachability of configured services', async () => {
    const fetchImpl = vi.fn(async (url) =>
      url.startsWith('http://cuga')
        ? okJson({})
        : Promise.reject(new Error('down')),
    )
    const handler = createHandler({
      env: { CUGA_BASE_URL: 'http://cuga/', HIVE_BASE_URL: 'http://hive' },
      fetchImpl,
    })
    const { body } = await call(handler, { url: '/api/status' })
    expect(body.cugaApi.reachable).toBe(true)
    expect(body.hiveApi.reachable).toBe(false)
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://cuga/health',
      expect.anything(),
    )
  })

  it('returns 503 for unconfigured chat and runs', async () => {
    const handler = createHandler({ env: {} })
    const chat = await call(handler, {
      method: 'POST',
      url: '/api/cuga/chat',
      body: '{}',
    })
    expect(chat).toEqual({
      status: 503,
      body: { error: 'cuga_not_configured' },
    })
    const runs = await call(handler, { url: '/api/hive/runs' })
    expect(runs).toEqual({
      status: 503,
      body: { error: 'hive_not_configured' },
    })
  })

  it('validates chat input', async () => {
    const handler = createHandler({ env: { CUGA_BASE_URL: 'http://cuga' } })
    const post = (body) =>
      call(handler, { method: 'POST', url: '/api/cuga/chat', body })
    expect((await post('nope')).body.error).toBe('invalid_json')
    expect((await post('{"message":"","pageContext":"x"}')).body.error).toBe(
      'invalid_message',
    )
    expect((await post('{"message":"hi","pageContext":""}')).body.error).toBe(
      'invalid_page_context',
    )
    expect((await post('x'.repeat(20_000))).status).toBe(413)
  })

  it('forwards chat to CUGA /stream and returns the final answer', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          'event: CodeAgent\ndata: thinking\n\nevent: Answer\ndata: 30 days\n\n',
        ),
    )
    const handler = createHandler({
      env: { CUGA_BASE_URL: 'http://cuga' },
      fetchImpl,
    })
    const { status, body } = await call(handler, {
      method: 'POST',
      url: '/api/cuga/chat',
      body: JSON.stringify({
        message: 'How long?',
        pageContext: 'Kept 30 days',
      }),
    })
    expect(status).toBe(200)
    expect(body.answer).toBe('30 days')
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://cuga/stream')
    expect(JSON.parse(init.body).query).toContain('Kept 30 days')
  })

  it('finds Answer and Error past the event display cap', async () => {
    const filler = Array.from(
      { length: 60 },
      (_, i) => `event: Step\ndata: s${i}\n\n`,
    ).join('')
    const run = (tail) => {
      const handler = createHandler({
        env: { CUGA_BASE_URL: 'http://cuga' },
        fetchImpl: async () => new Response(filler + tail),
      })
      return call(handler, {
        method: 'POST',
        url: '/api/cuga/chat',
        body: JSON.stringify({ message: 'Q', pageContext: 'ctx' }),
      })
    }
    const ok = await run('event: Answer\ndata: late answer\n\n')
    expect(ok.body.answer).toBe('late answer')
    expect(ok.body.events).toHaveLength(40)
    const failed = await run('event: Error\ndata: boom\n\n')
    expect(failed.body).toEqual({ error: 'cuga_run_failed' })
  })

  it('maps CUGA failures to safe error codes', async () => {
    const make = (fetchImpl) =>
      createHandler({ env: { CUGA_BASE_URL: 'http://cuga' }, fetchImpl })
    const req = {
      method: 'POST',
      url: '/api/cuga/chat',
      body: '{"message":"a","pageContext":"b"}',
    }
    expect(
      (
        await call(
          make(async () => {
            throw new Error('secret detail')
          }),
          req,
        )
      ).body,
    ).toEqual({ error: 'cuga_unreachable' })
    expect(
      (
        await call(
          make(async () => new Response('', { status: 500 })),
          req,
        )
      ).body,
    ).toEqual({ error: 'cuga_error' })
    expect(
      (
        await call(
          make(async () => new Response('event: Error\ndata: boom\n\n')),
          req,
        )
      ).body,
    ).toEqual({ error: 'cuga_run_failed' })
  })

  it('sends the Hive token server-side and returns only selected run fields', async () => {
    const fetchImpl = vi.fn(async () =>
      okJson([
        {
          key: 'o/r#1',
          title: 'T',
          repo: 'o/r',
          stage: 'plan',
          waiting_on: 'human',
          assignee: 'scanner',
          secret: 'x',
        },
      ]),
    )
    const handler = createHandler({
      env: { HIVE_BASE_URL: 'http://hive', HIVE_DASHBOARD_TOKEN: 'tok' },
      fetchImpl,
    })
    const { status, body } = await call(handler, { url: '/api/hive/runs' })
    expect(status).toBe(200)
    expect(body.runs[0]).toEqual({
      key: 'o/r#1',
      title: 'T',
      repo: 'o/r',
      stage: 'plan',
      waitingOn: 'human',
      assignee: 'scanner',
    })
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toBe('Bearer tok')
    expect(JSON.stringify(body)).not.toContain('tok')
  })

  it('maps Hive failures to safe error codes', async () => {
    const make = (fetchImpl) =>
      createHandler({ env: { HIVE_BASE_URL: 'http://hive' }, fetchImpl })
    const get = (fetchImpl) => call(make(fetchImpl), { url: '/api/hive/runs' })
    expect(
      (
        await get(async () => {
          throw new Error('x')
        })
      ).body.error,
    ).toBe('hive_unreachable')
    expect(
      (await get(async () => new Response('', { status: 401 }))).body.error,
    ).toBe('hive_auth_failed')
    expect(
      (await get(async () => new Response('', { status: 500 }))).body.error,
    ).toBe('hive_error')
    expect(
      (await get(async () => okJson({ not: 'an array' }))).body.error,
    ).toBe('hive_error')
  })

  it('requires the access token when one is configured', async () => {
    const handler = createHandler({ env: { BFF_ACCESS_TOKEN: 's3' } })
    expect((await call(handler, { url: '/api/status' })).status).toBe(401)
    const ok = await call(handler, {
      url: '/api/status',
      headers: { 'x-access-token': 's3' },
    })
    expect(ok.status).toBe(200)
  })

  it('rate limits wrong access tokens', async () => {
    const handler = createHandler({
      env: { BFF_ACCESS_TOKEN: 's3', RATE_LIMIT_PER_MINUTE: '2' },
    })
    const bad = () =>
      call(handler, { url: '/api/status', headers: { 'x-access-token': 'no' } })
    expect((await bad()).status).toBe(401)
    expect((await bad()).status).toBe(401)
    expect((await bad()).status).toBe(429)
  })

  it('rate limits per client and recovers after a minute', async () => {
    let time = 0
    const handler = createHandler({
      env: { RATE_LIMIT_PER_MINUTE: '2' },
      now: () => time,
    })
    const hit = () => call(handler, { url: '/api/status' })
    expect((await hit()).status).toBe(200)
    expect((await hit()).status).toBe(200)
    expect((await hit()).body.error).toBe('rate_limited')
    time = 61_000
    expect((await hit()).status).toBe(200)
  })

  it('keys the rate limit on X-Forwarded-For only when the proxy is trusted', async () => {
    const run = async (env) => {
      const handler = createHandler({
        env: { RATE_LIMIT_PER_MINUTE: '1', ...env },
      })
      const a = await call(handler, {
        url: '/api/status',
        headers: { 'x-forwarded-for': '9.9.9.1' },
      })
      const b = await call(handler, {
        url: '/api/status',
        headers: { 'x-forwarded-for': '9.9.9.2' },
      })
      return [a.status, b.status]
    }
    expect(await run({})).toEqual([200, 429])
    expect(await run({ TRUST_PROXY: '1' })).toEqual([200, 200])
  })

  it('ignores client-supplied X-Forwarded-For entries when the proxy is trusted', async () => {
    const handler = createHandler({
      env: { RATE_LIMIT_PER_MINUTE: '1', TRUST_PROXY: '1' },
    })
    const hit = (spoofed) =>
      call(handler, {
        url: '/api/status',
        headers: { 'x-forwarded-for': `${spoofed}, 203.0.113.7` },
      })
    expect((await hit('9.9.9.1')).status).toBe(200)
    expect((await hit('9.9.9.2')).body.error).toBe('rate_limited')
  })

  it('returns 404 for unknown routes and hides internal errors', async () => {
    const handler = createHandler({ env: {} })
    expect((await call(handler, { url: '/nope' })).body.error).toBe('not_found')
    const broken = createHandler({
      env: { HIVE_BASE_URL: 'http://hive' },
      fetchImpl: async () => ({
        status: 200,
        ok: true,
        json: () => {
          throw new Error('stack')
        },
      }),
    })
    const res = await call(broken, { url: '/api/hive/runs' })
    expect(JSON.stringify(res.body)).not.toContain('stack')
  })
})
