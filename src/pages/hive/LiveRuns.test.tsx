import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LiveRuns from './LiveRuns'

function mockRuns(response: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(response))
}

afterEach(() => vi.unstubAllGlobals())

describe('LiveRuns', () => {
  it('shows a loading state, then the runs from /api/hive/runs', async () => {
    mockRuns(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            runs: [
              {
                key: 'org/repo#1',
                title: 'Fix the thing',
                repo: 'org/repo',
                stage: 'review',
                waitingOn: 'maintainer',
                assignee: null,
              },
            ],
          }),
        ),
      ),
    )
    render(<LiveRuns />)
    expect(screen.getByText('Loading runs from Hive')).toBeInTheDocument()
    expect(await screen.findByText('Fix the thing')).toBeInTheDocument()
    expect(screen.getByText('org/repo#1')).toBeInTheDocument()
    expect(screen.getByText('unassigned')).toBeInTheDocument()
    expect(screen.getByText('Live: Hive')).toBeInTheDocument()
  })

  it('says so when Hive reports no runs', async () => {
    mockRuns(() => Promise.resolve(new Response(JSON.stringify({ runs: [] }))))
    render(<LiveRuns />)
    expect(
      await screen.findByText('Hive reports no active runs.'),
    ).toBeInTheDocument()
  })

  it('shows an error notification when the request fails', async () => {
    mockRuns(() => Promise.reject(new Error('boom')))
    render(<LiveRuns />)
    expect(
      await screen.findByText('Could not load Hive runs.'),
    ).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})
