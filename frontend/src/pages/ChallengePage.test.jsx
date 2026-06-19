import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import ChallengePage from './ChallengePage'

// Silence Monaco editor errors in jsdom
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange }) => (
    <textarea
      data-testid="monaco-editor"
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))

function renderChallenge(topicId, index) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/challenges/${topicId}/${index}`]}>
        <Routes>
          <Route path="/challenges/:topicId/:index" element={<ChallengePage alias="tester" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ChallengePage — sandbox layout', () => {
  it('renders one iframe for sandboxType: srcdoc (XSS challenge 0)', () => {
    renderChallenge('xss', 0)
    const frames = document.querySelectorAll('iframe')
    expect(frames.length).toBe(1)
  })

  it('renders two iframes for sandboxType: csrf (CSRF challenge 0)', () => {
    renderChallenge('csrf', 0)
    const frames = document.querySelectorAll('iframe')
    expect(frames.length).toBe(2)
  })

  it('shows "ATTACKER PAGE" and "VICTIM SESSION" labels for csrf', () => {
    renderChallenge('csrf', 0)
    expect(screen.getAllByText(/attacker page/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/victim session/i).length).toBeGreaterThan(0)
  })
})

describe('ChallengePage — success detection', () => {
  it('shows success modal when csrf-triggered postMessage is received', async () => {
    renderChallenge('csrf', 0)

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'csrf-triggered' },
      }))
    })

    expect(screen.getByText(/challenge solved/i)).toBeInTheDocument()
  })

  it('shows success modal when xss-triggered postMessage is received', async () => {
    renderChallenge('xss', 0)

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'xss-triggered' },
      }))
    })

    expect(screen.getByText(/challenge solved/i)).toBeInTheDocument()
  })
})
