import { describe, expect, it } from 'vitest'
import { describeError, getJson, postJson, useServiceStatus } from './api'

describe('api backward compatibility', () => {
  it('re-exports expected http helpers and hooks', () => {
    expect(describeError).toBeTypeOf('function')
    expect(getJson).toBeTypeOf('function')
    expect(postJson).toBeTypeOf('function')
    expect(useServiceStatus).toBeTypeOf('function')
  })
})
