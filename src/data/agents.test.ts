import { describe, expect, it } from 'vitest'
import { AGENTS } from './agents'

describe('AGENTS', () => {
  it('defines the six hive agents once, with unique ids', () => {
    expect(AGENTS.map((a) => a.id)).toEqual([
      'scanner',
      'architect',
      'ci-maintainer',
      'supervisor',
      'outreach',
      'sec-check',
    ])
  })

  it('has non-empty copy for every field', () => {
    for (const agent of AGENTS) {
      for (const value of Object.values(agent)) {
        expect(value.trim()).not.toBe('')
      }
    }
  })

  it('has valid tier levels for all agents', () => {
    const validTiers = new Set(['L4', 'L5', 'L7'])
    for (const agent of AGENTS) {
      expect(validTiers.has(agent.tier)).toBe(true)
    }
  })

  it('contains all required schema fields on every agent object', () => {
    const requiredKeys = [
      'id',
      'label',
      'tier',
      'summary',
      'detail',
      'description',
    ]
    for (const agent of AGENTS) {
      expect(Object.keys(agent).sort()).toEqual(requiredKeys.sort())
    }
  })
})
