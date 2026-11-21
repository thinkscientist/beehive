import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AGENTS } from '../data/agents'
import Home from './Home'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renders the main heading', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: 'Welcome to Beehive' }),
    ).toBeInTheDocument()
  })

  it('renders the hero description', () => {
    renderHome()
    expect(
      screen.getByText(/autonomous multi-agent swarm/i),
    ).toBeInTheDocument()
  })

  it('renders the Meet the agents CTA link', () => {
    renderHome()
    const link = screen.getByRole('link', { name: /meet the agents/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/about')
  })

  it('renders the Get in touch CTA link', () => {
    renderHome()
    const link = screen.getByRole('link', { name: /get in touch/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/contact')
  })

  it('renders the Agent roles section heading', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { name: 'Agent roles' }),
    ).toBeInTheDocument()
  })

  it('renders all six agent feature tiles with labels and descriptions', () => {
    renderHome()
    for (const { label, description } of AGENTS) {
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    }
  })
})
