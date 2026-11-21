import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AGENTS } from '../data/agents'
import About from './About'

describe('About', () => {
  it('renders the main heading and intro text', () => {
    render(<About />)
    expect(
      screen.getByRole('heading', { name: 'About Beehive' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/multi-agent ai swarm built on the hive/i),
    ).toBeInTheDocument()
  })

  it('renders the Agent roster heading and table headers', () => {
    render(<About />)
    expect(
      screen.getByRole('heading', { name: 'Agent roster' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Agent')).toBeInTheDocument()
    expect(screen.getByText('Tier')).toBeInTheDocument()
    expect(screen.getByText('Responsibility')).toBeInTheDocument()
  })

  it('renders all six agents with their tiers and summaries in the structured list', () => {
    render(<About />)
    for (const { label, tier, summary } of AGENTS) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
      expect(screen.getAllByText(tier).length).toBeGreaterThan(0)
      expect(screen.getByText(summary)).toBeInTheDocument()
    }
  })

  it('renders Role details accordion heading and accordion items', () => {
    render(<About />)
    expect(
      screen.getByRole('heading', { name: 'Role details' }),
    ).toBeInTheDocument()
    for (const { label } of AGENTS) {
      expect(
        screen.getByRole('button', { name: new RegExp(label, 'i') }),
      ).toBeInTheDocument()
    }
  })

  it('expands accordion items to show detail text', async () => {
    render(<About />)
    const scannerButton = screen.getByRole('button', { name: /scanner/i })
    await userEvent.click(scannerButton)
    expect(screen.getByText(/first agent dispatched/i)).toBeInTheDocument()

    const architectButton = screen.getByRole('button', { name: /architect/i })
    await userEvent.click(architectButton)
    expect(
      screen.getByText(/too large or structurally complex/i),
    ).toBeInTheDocument()

    const secCheckButton = screen.getByRole('button', { name: /sec-check/i })
    await userEvent.click(secCheckButton)
    expect(screen.getByText(/automated security scans/i)).toBeInTheDocument()
  })
})
