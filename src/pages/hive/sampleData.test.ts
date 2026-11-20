import { describe, expect, it } from 'vitest'
import {
  SAMPLE_LANES,
  SAMPLE_REPO,
  SAMPLE_STAGES,
  SAMPLE_TASK_TITLE,
  TRUST_LEVELS,
} from './sampleData'

describe('sampleData', () => {
  describe('SAMPLE_STAGES', () => {
    it('defines seven sequential stages with valid stage labels', () => {
      expect(SAMPLE_STAGES.map((s) => s.label)).toEqual([
        'stage/010-actionable',
        'stage/020-claimed',
        'stage/030-pr-in-progress',
        'stage/040-covered-by-pr',
        'stage/050-review-pending',
        'stage/060-reviewed',
        'stage/090-ready-for-human-merge',
      ])
    })

    it('assigns valid target types and actors to every stage', () => {
      for (const stage of SAMPLE_STAGES) {
        expect(['issue', 'PR']).toContain(stage.appliesTo)
        expect(['agent', 'human', 'hive']).toContain(stage.actor)
        expect(stage.summary.trim()).not.toBe('')
        expect(stage.audit.trim()).not.toBe('')
      }
    })
  })

  describe('TRUST_LEVELS', () => {
    it('defines six sequential trust levels from L1 to L6', () => {
      expect(TRUST_LEVELS.map((t) => t.level)).toEqual([
        'L1',
        'L2',
        'L3',
        'L4',
        'L5',
        'L6',
      ])
    })

    it('has non-empty names and summaries for all trust levels', () => {
      for (const level of TRUST_LEVELS) {
        expect(level.name.trim()).not.toBe('')
        expect(level.summary.trim()).not.toBe('')
      }
    })
  })

  describe('SAMPLE_LANES', () => {
    it('defines lanes with valid statuses and descriptions', () => {
      expect(SAMPLE_LANES.length).toBeGreaterThan(0)
      for (const lane of SAMPLE_LANES) {
        expect(['working', 'idle', 'waiting on human']).toContain(lane.status)
        expect(lane.role.trim()).not.toBe('')
        expect(lane.doing.trim()).not.toBe('')
      }
    })
  })

  describe('sample constants', () => {
    it('defines non-empty sample repo and task title', () => {
      expect(SAMPLE_REPO).toBe('example-org/sample-repo')
      expect(SAMPLE_TASK_TITLE.trim()).not.toBe('')
    })
  })
})
