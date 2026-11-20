import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HiveFleet from './HiveFleet'

const json =
  (body: unknown, status = 200) =>
  () =>
    new Response(JSON.stringify(body), { status })

function mockFetch(routes: Record<string, () => Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const handler = routes[url]
      return handler
        ? Promise.resolve(handler())
        : Promise.reject(new Error('network'))
    }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('HiveFleet guided preview', () => {
  it('labels everything as sample data when Hive is not connected', async () => {
    mockFetch({})
    render(<HiveFleet />)
    expect(await screen.findByText(/Hive is not connected/)).toBeInTheDocument()
    expect(screen.getAllByText('Sample data, not live').length).toBeGreaterThan(
      0,
    )
    expect(screen.queryByText('Live: Hive')).toBeNull()
  })

  it('walks a sample task through the stages up to human merge', async () => {
    mockFetch({})
    render(<HiveFleet />)
    await screen.findByText(/Hive is not connected/)
    const previous = screen.getByRole('button', { name: 'Previous stage' })
    expect(previous).toBeDisabled()
    const advance = screen.getByRole('button', { name: 'Advance stage' })
    for (let i = 0; i < 6; i++) await userEvent.click(advance)
    expect(advance).toBeDisabled()
    expect(screen.getByText(/Waiting on a maintainer/)).toBeInTheDocument()
    await userEvent.click(previous)
    expect(screen.getByText(/CI still running/)).toBeInTheDocument()
  })

  it('jumps to a stage when its progress step is clicked', async () => {
    mockFetch({})
    render(<HiveFleet />)
    await screen.findByText(/Hive is not connected/)
    await userEvent.click(screen.getByText('stage/060-reviewed'))
    expect(screen.getByText(/CI still running/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous stage' })).toBeEnabled()
  })

  it('lists the documented trust levels and offers no chat input', async () => {
    mockFetch({})
    render(<HiveFleet />)
    await screen.findByText(/Hive is not connected/)
    expect(screen.getByText(/L5 Semi-Autonomous/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('HiveFleet with a live Hive', () => {
  const status = {
    cugaApi: { configured: false, reachable: false },
    hiveApi: { configured: true, reachable: true },
  }

  it('shows runs returned by the backend', async () => {
    mockFetch({
      '/api/status': json(status),
      '/api/hive/runs': json({
        runs: [
          {
            key: 'o/r#1',
            title: 'Fix it',
            repo: 'o/r',
            stage: 'implement',
            waitingOn: 'agent',
            assignee: null,
          },
        ],
      }),
    })
    render(<HiveFleet />)
    expect(await screen.findByText('Fix it')).toBeInTheDocument()
    expect(screen.getByText('Live: Hive')).toBeInTheDocument()
    expect(screen.getByText('unassigned')).toBeInTheDocument()
  })

  it('shows an empty state and a safe error', async () => {
    mockFetch({
      '/api/status': json(status),
      '/api/hive/runs': json({ runs: [] }),
    })
    const { unmount } = render(<HiveFleet />)
    expect(await screen.findByText(/no active runs/)).toBeInTheDocument()
    unmount()

    mockFetch({
      '/api/status': json(status),
      '/api/hive/runs': json({ error: 'hive_auth_failed' }, 502),
    })
    render(<HiveFleet />)
    expect(
      await screen.findByText(/rejected the configured credential/),
    ).toBeInTheDocument()
  })
})
