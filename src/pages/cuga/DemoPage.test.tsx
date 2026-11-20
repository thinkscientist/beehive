import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DemoPage from './DemoPage'
import { BASELINE_PAGE, PRIMARY_BUTTON_LABEL } from './guidedEngine'

describe('DemoPage', () => {
  it('renders the heading, every section and the primary button', () => {
    render(<DemoPage page={BASELINE_PAGE} highlight={null} />)
    const preview = screen.getByRole('article', { name: 'Demo page preview' })
    expect(preview).not.toHaveClass('cuga-page--calm')
    expect(screen.getByRole('heading', { name: 'Terms stuff' })).toBeVisible()
    for (const section of BASELINE_PAGE.sections) {
      expect(
        screen.getByRole('heading', { name: section.title }),
      ).toBeInTheDocument()
    }
    expect(
      screen.getByRole('button', { name: PRIMARY_BUTTON_LABEL }),
    ).not.toHaveClass('cuga-page__button--prominent')
  })

  it('marks only the highlighted section', () => {
    const { container } = render(
      <DemoPage page={BASELINE_PAGE} highlight="cancellation" />,
    )
    const marked = container.querySelectorAll('.cuga-page__mark--on')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('Cancellation policy')
  })

  it('marks the primary button when it is highlighted', () => {
    render(<DemoPage page={BASELINE_PAGE} highlight="primary-button" />)
    expect(
      screen.getByRole('button', { name: PRIMARY_BUTTON_LABEL }),
    ).toHaveClass('cuga-page__mark--on')
  })

  it('applies the calm theme, prominent button and added explanation', () => {
    render(
      <DemoPage
        page={{
          ...BASELINE_PAGE,
          calmTheme: true,
          prominentButton: true,
          explanation: 'Short version.',
        }}
        highlight={null}
      />,
    )
    expect(
      screen.getByRole('article', { name: 'Demo page preview' }),
    ).toHaveClass('cuga-page--calm')
    expect(
      screen.getByRole('button', { name: PRIMARY_BUTTON_LABEL }),
    ).toHaveClass('cuga-page__button--prominent')
    expect(screen.getByText('Short version.')).toHaveClass('cuga-page__added')
  })
})
