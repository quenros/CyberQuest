import { render, screen } from '@testing-library/react'

describe('test infrastructure', () => {
  it('vitest and jsdom are wired up', () => {
    expect(1 + 1).toBe(2)
  })

  it('React Testing Library renders into jsdom', () => {
    render(<p>hello world</p>)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })
})
