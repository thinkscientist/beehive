import { describe, expect, it } from 'vitest'
import { readConfig } from './app.mjs'

describe('readConfig', () => {
  it('applies safe defaults for an empty environment', () => {
    expect(readConfig({})).toEqual({
      cugaBase: '',
      hiveBase: '',
      hiveToken: '',
      accessToken: '',
      ratePerMinute: 20,
      trustProxy: false,
    })
  })

  it('strips trailing slashes from upstream base URLs', () => {
    const config = readConfig({
      CUGA_BASE_URL: 'http://cuga///',
      HIVE_BASE_URL: 'http://hive/',
    })
    expect(config.cugaBase).toBe('http://cuga')
    expect(config.hiveBase).toBe('http://hive')
  })

  it('falls back to the default rate limit for invalid or zero values', () => {
    expect(readConfig({ RATE_LIMIT_PER_MINUTE: 'abc' }).ratePerMinute).toBe(20)
    expect(readConfig({ RATE_LIMIT_PER_MINUTE: '0' }).ratePerMinute).toBe(20)
    expect(readConfig({ RATE_LIMIT_PER_MINUTE: '5' }).ratePerMinute).toBe(5)
  })

  it('trusts the proxy only when TRUST_PROXY is exactly 1', () => {
    expect(readConfig({ TRUST_PROXY: '1' }).trustProxy).toBe(true)
    expect(readConfig({ TRUST_PROXY: 'true' }).trustProxy).toBe(false)
    expect(readConfig({ TRUST_PROXY: '' }).trustProxy).toBe(false)
  })

  it('reads the Hive and access tokens', () => {
    const config = readConfig({
      HIVE_DASHBOARD_TOKEN: 'h',
      BFF_ACCESS_TOKEN: 'a',
    })
    expect(config.hiveToken).toBe('h')
    expect(config.accessToken).toBe('a')
  })
})
