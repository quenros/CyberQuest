import { render, screen } from '@testing-library/react'
import ModuleIntro from './ModuleIntro'

const sections = [
  { heading: 'HTTP is stateless', body: 'Each request arrives with no memory of the last.' },
  { heading: 'What a cookie is', body: 'A key-value pair the server asks the browser to store.' },
]

describe('ModuleIntro', () => {
  it('renders each section heading', () => {
    render(<ModuleIntro sections={sections} />)
    expect(screen.getByText('HTTP is stateless')).toBeInTheDocument()
    expect(screen.getByText('What a cookie is')).toBeInTheDocument()
  })

  it('renders each section body', () => {
    render(<ModuleIntro sections={sections} />)
    expect(screen.getByText(/Each request arrives/)).toBeInTheDocument()
    expect(screen.getByText(/key-value pair/)).toBeInTheDocument()
  })

  it('renders nothing when sections is empty', () => {
    const { container } = render(<ModuleIntro sections={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
