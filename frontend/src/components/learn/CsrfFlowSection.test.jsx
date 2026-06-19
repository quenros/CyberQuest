import { render, screen } from '@testing-library/react'
import CsrfFlowSection from './CsrfFlowSection'

describe('CsrfFlowSection', () => {
  it('renders the replay button', () => {
    render(<CsrfFlowSection />)
    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument()
  })

  it('renders the key actor labels', () => {
    render(<CsrfFlowSection />)
    expect(screen.getAllByText(/attacker/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/victim/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/server/i).length).toBeGreaterThan(0)
  })
})
