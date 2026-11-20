import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useServiceStatus } from './useServiceStatus'

const status = {
  cugaApi: { configured: true, reachable: true },
  hiveApi: { configured: false, reachable: false },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubStatus(body: unknown, ok: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }),
  )
}

describe('useServiceStatus', () => {
  it('starts loading, then reports the status from /api/status', async () => {
    stubStatus(status, true)
    const { result } = renderHook(() => useServiceStatus())
    expect(result.current).toEqual({ phase: 'loading' })
    await waitFor(() =>
      expect(result.current).toEqual({ phase: 'ready', status }),
    )
  })

  it('is unavailable when the backend answers with an error status', async () => {
    stubStatus({}, false)
    const { result } = renderHook(() => useServiceStatus())
    await waitFor(() =>
      expect(result.current).toEqual({ phase: 'unavailable' }),
    )
  })

  it('is unavailable when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { result } = renderHook(() => useServiceStatus())
    await waitFor(() =>
      expect(result.current).toEqual({ phase: 'unavailable' }),
    )
  })

  it('aborts the request on unmount without updating state', async () => {
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        signal = init.signal ?? undefined
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
      }),
    )
    const { result, unmount } = renderHook(() => useServiceStatus())
    unmount()
    await Promise.resolve()
    expect(signal?.aborted).toBe(true)
    expect(result.current).toEqual({ phase: 'loading' })
  })
})
