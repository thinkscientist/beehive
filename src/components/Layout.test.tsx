import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Home content</p>} />
          <Route path="about" element={<p>About content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('renders header brand link and skip to main content link', () => {
    renderLayout()
    expect(
      screen.getByRole('link', { name: /skip to main content/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Beehive' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('renders all navigation items in header navigation', () => {
    renderLayout()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const label of [
      'Home',
      'About',
      'CUGA Page Studio',
      'Hive Agent Fleet',
      'Contact',
    ]) {
      expect(
        within(nav).getByRole('menuitem', { name: label }),
      ).toBeInTheDocument()
    }
  })

  it('renders all navigation items in side navigation', () => {
    renderLayout()
    const sideNav = screen.getByRole('navigation', { name: 'Side navigation' })
    for (const label of [
      'Home',
      'About',
      'CUGA Page Studio',
      'Hive Agent Fleet',
      'Contact',
    ]) {
      expect(
        within(sideNav).getByRole('link', { name: label }),
      ).toBeInTheDocument()
    }
  })

  it('closes the side navigation when one of its links is clicked', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(
      screen.getByRole('button', { name: 'Close menu' }),
    ).toBeInTheDocument()

    const sideNav = screen.getByRole('navigation', { name: 'Side navigation' })
    await userEvent.click(within(sideNav).getByRole('link', { name: 'About' }))

    expect(screen.getByText('About content')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open menu' }),
    ).toBeInTheDocument()
  })

  it('reopens and closes the side navigation with the menu button', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(
      screen.getByRole('button', { name: 'Open menu' }),
    ).toBeInTheDocument()
  })
})
