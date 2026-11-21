import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Contact from './Contact'

describe('Contact', () => {
  it('renders the main heading', () => {
    render(<Contact />)
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
  })

  it('renders name, email, reason and message fields', () => {
    render(<Contact />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reason for enquiry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('renders a Send message submit button', () => {
    render(<Contact />)
    expect(
      screen.getByRole('button', { name: /send message/i }),
    ).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', async () => {
    render(<Contact />)
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()
  })

  it('shows an email format error for an invalid email', async () => {
    render(<Contact />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'not-an-email',
    )
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
  })

  it('shows success notification on valid submission', async () => {
    render(<Contact />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Smith')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'jane@example.com',
    )
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello there')
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText(/message sent/i)).toBeInTheDocument()
  })

  it('clears the form after successful submission', async () => {
    render(<Contact />)
    const nameInput = screen.getByLabelText(/full name/i)
    await userEvent.type(nameInput, 'Jane Smith')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'jane@example.com',
    )
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello there')
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect((nameInput as HTMLInputElement).value).toBe('')
  })

  it('clears field errors once the user edits those fields', async () => {
    render(<Contact />)
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/full name/i), 'J')
    expect(screen.queryByText('Name is required.')).not.toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'jane@example.com',
    )
    expect(
      screen.queryByText('Email address is required.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/message/i), 'Hello')
    expect(screen.queryByText('Message is required.')).not.toBeInTheDocument()
  })

  it('allows selecting enquiry reason', async () => {
    render(<Contact />)
    const select = screen.getByLabelText(/reason for enquiry/i)
    expect((select as HTMLSelectElement).value).toBe('general')
    await userEvent.selectOptions(select, 'partnership')
    expect((select as HTMLSelectElement).value).toBe('partnership')
  })

  it('shows validation errors when fields contain only whitespace', async () => {
    render(<Contact />)
    await userEvent.type(screen.getByLabelText(/full name/i), '   ')
    await userEvent.type(screen.getByLabelText(/email address/i), '   ')
    await userEvent.type(screen.getByLabelText(/message/i), '   ')
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Message is required.')).toBeInTheDocument()
  })

  it('dismisses the success notification when close button is clicked', async () => {
    render(<Contact />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Smith')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'jane@example.com',
    )
    await userEvent.type(screen.getByLabelText(/message/i), 'Hello there')
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(screen.getByText(/message sent/i)).toBeInTheDocument()

    const closeButton = screen.getByRole('button', {
      name: /close notification/i,
    })
    await userEvent.click(closeButton)
    expect(screen.queryByText(/message sent/i)).not.toBeInTheDocument()
  })
})
