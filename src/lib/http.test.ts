import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeError, getJson, postJson } from './http'

function mockFetch(body: unknown, init: { ok: boolean; json?: boolean }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok,
    json:
      init.json === false
        ? () => Promise.reject(new Error('bad json'))
        : () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('describeError', () => {
  it('maps known backend codes to visitor-safe text', () => {
    expect(describeError('rate_limited')).toBe(
      'Too many requests. Wait a minute and try again.',
    )
    expect(describeError('hive_auth_failed')).toBe(
      'Hive rejected the configured credential.',
    )
  })

  it('falls back to a generic message for unknown or missing codes', () => {
    const generic = 'Something went wrong. Try again later.'
    expect(describeError('upstream stack trace')).toBe(generic)
    expect(describeError(undefined)).toBe(generic)
  })
})

describe('postJson', () => {
  it('posts the body as JSON and returns the payload', async () => {
    const fetchMock = mockFetch({ answer: 'hi' }, { ok: true })
    await expect(postJson('/api/cuga/run', { q: 'x' })).resolves.toEqual({
      answer: 'hi',
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/cuga/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'x' }),
    })
  })

  it('throws the mapped message when the response is not ok', async () => {
    mockFetch({ error: 'cuga_unreachable' }, { ok: false })
    await expect(postJson('/api/cuga/run', {})).rejects.toThrow(
      'CUGA could not be reached. Check that it is running.',
    )
  })

  it('throws the generic message when the error body is not JSON', async () => {
    mockFetch(null, { ok: false, json: false })
    await expect(postJson('/api/cuga/run', {})).rejects.toThrow(
      'Something went wrong. Try again later.',
    )
  })
})

describe('getJson', () => {
  it('returns the payload for an ok response', async () => {
    const fetchMock = mockFetch({ runs: [] }, { ok: true })
    await expect(getJson('/api/runs')).resolves.toEqual({ runs: [] })
    expect(fetchMock).toHaveBeenCalledWith('/api/runs')
  })

  it('throws the mapped message when the response is not ok', async () => {
    mockFetch({ error: 'unauthorized' }, { ok: false })
    await expect(getJson('/api/runs')).rejects.toThrow(
      'This site requires an access token for live services.',
    )
  })

  it('throws the generic message when the error body is not JSON', async () => {
    mockFetch(null, { ok: false, json: false })
    await expect(getJson('/api/runs')).rejects.toThrow(
      'Something went wrong. Try again later.',
    )
  })
})
