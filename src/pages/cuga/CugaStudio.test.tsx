import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CugaStudio from './CugaStudio'

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

const json =
  (body: unknown, status = 200) =>
  () =>
    new Response(JSON.stringify(body), { status })

afterEach(() => vi.unstubAllGlobals())

describe('CugaStudio without a backend', () => {
  it('falls back to a guided demo and labels results as simulated', async () => {
    mockFetch({})
    render(<CugaStudio />)
    expect(await screen.findByText(/CUGA is not connected/)).toBeInTheDocument()
    expect(screen.getByText('Guided demo: simulated')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Live CUGA' })).toBeDisabled()
  })

  it('edits the preview, then supports before/after, undo and reset', async () => {
    mockFetch({})
    render(<CugaStudio />)
    await screen.findByText(/CUGA is not connected/)
    const preview = () =>
      screen.getByRole('article', { name: 'Demo page preview' })

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Rewrite this heading to be clearer.',
      }),
    )
    expect(within(preview()).queryByText('Terms stuff')).toBeNull()
    expect(
      screen.getByRole('list', { name: 'Action timeline' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('guided demo').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Show before' }))
    expect(within(preview()).getByText('Terms stuff')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Show after' }))

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(within(preview()).getByText('Terms stuff')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument()
  })

  it('accepts typed requests', async () => {
    mockFetch({})
    render(<CugaStudio />)
    await screen.findByText(/CUGA is not connected/)
    await userEvent.type(
      screen.getByLabelText('Ask or request an edit'),
      'Which button is the main action?{enter}',
    )
    expect(await screen.findByText(/"Accept terms" button/)).toBeInTheDocument()
  })
})

describe('CugaStudio with a live CUGA', () => {
  const status = {
    cugaApi: { configured: true, reachable: true },
    hiveApi: { configured: false, reachable: false },
  }

  it('labels answers as live and says edits stay in the guided demo', async () => {
    mockFetch({
      '/api/status': json(status),
      '/api/cuga/chat': json({
        answer: 'Files are kept 30 days.',
        events: [{ name: 'Answer' }],
      }),
    })
    render(<CugaStudio />)
    const live = await screen.findByRole('tab', { name: 'Live CUGA' })
    await waitFor(() => expect(live).toBeEnabled())
    await userEvent.click(live)
    expect(screen.getByText('Live: CUGA')).toBeInTheDocument()
    expect(screen.getByText(/answers questions only/)).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', {
        name: 'What does this page say about data retention?',
      }),
    )
    expect(
      await screen.findByText('Files are kept 30 days.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('live CUGA').length).toBeGreaterThan(0)
  })

  it('shows a safe error when the backend fails and can be dismissed', async () => {
    mockFetch({
      '/api/status': json(status),
      '/api/cuga/chat': json({ error: 'cuga_unreachable' }, 502),
    })
    render(<CugaStudio />)
    const live = await screen.findByRole('tab', { name: 'Live CUGA' })
    await waitFor(() => expect(live).toBeEnabled())
    await userEvent.click(live)
    await userEvent.type(
      screen.getByLabelText('Ask or request an edit'),
      'hello{enter}',
    )
    expect(
      await screen.findByText(/CUGA could not be reached/),
    ).toBeInTheDocument()

    const closeButton = screen.getByRole('button', {
      name: /close notification/i,
    })
    await userEvent.click(closeButton)
    expect(
      screen.queryByText(/CUGA could not be reached/),
    ).not.toBeInTheDocument()
  })
})
