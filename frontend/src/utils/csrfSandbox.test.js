
// ── buildVictimSrcdoc smoke test ─────────────────────────────────────────────

import { processRequest, buildVictimSrcdoc } from './csrfSandbox'

describe('buildVictimSrcdoc', () => {
  it('returns a non-empty HTML string for each challenge', () => {
    expect(buildVictimSrcdoc('csrf-1-get').length).toBeGreaterThan(0)
    expect(buildVictimSrcdoc('csrf-2-post').length).toBeGreaterThan(0)
    expect(buildVictimSrcdoc('csrf-3-token').length).toBeGreaterThan(0)
  })
})

// ── Challenge 1: GET-based email change ─────────────────────────────────────

describe('processRequest — challenge 1 (GET email change)', () => {
  const initialState = { challenge: 'csrf-1-get', email: 'victim@corp.com' }

  it('triggers when correct GET request received', () => {
    const req = { method: 'GET', path: '/change-email', params: { email: 'attacker@evil.com' } }
    const { triggered, newState } = processRequest(initialState, req)
    expect(triggered).toBe(true)
    expect(newState.email).toBe('attacker@evil.com')
  })

  it('does not trigger for wrong path', () => {
    const req = { method: 'GET', path: '/other', params: { email: 'attacker@evil.com' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })

  it('does not trigger when email param is missing', () => {
    const req = { method: 'GET', path: '/change-email', params: {} }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })

  it('does not trigger for POST method', () => {
    const req = { method: 'POST', path: '/change-email', params: { email: 'attacker@evil.com' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })
})

// ── Challenge 2: POST-based email change ─────────────────────────────────────

describe('processRequest — challenge 2 (POST email change)', () => {
  const initialState = { challenge: 'csrf-2-post', email: 'victim@corp.com' }

  it('triggers when correct POST request received', () => {
    const req = { method: 'POST', path: '/change-email', params: { email: 'attacker@evil.com' } }
    const { triggered, newState } = processRequest(initialState, req)
    expect(triggered).toBe(true)
    expect(newState.email).toBe('attacker@evil.com')
  })

  it('does not trigger for GET method', () => {
    const req = { method: 'GET', path: '/change-email', params: { email: 'attacker@evil.com' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })

  it('does not trigger when email param is missing', () => {
    const req = { method: 'POST', path: '/change-email', params: {} }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })
})

// ── Challenge 3: CSRF token bypass ───────────────────────────────────────────

describe('processRequest — challenge 3 (token bypass)', () => {
  const initialState = { challenge: 'csrf-3-token', email: 'victim@corp.com' }

  it('triggers with an arbitrary token value', () => {
    const req = { method: 'POST', path: '/change-email', params: { email: 'attacker@evil.com', csrf_token: 'fake' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(true)
  })

  it('triggers with a blank token value', () => {
    const req = { method: 'POST', path: '/change-email', params: { email: 'attacker@evil.com', csrf_token: '' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(true)
  })

  it('does not trigger when csrf_token field is absent entirely', () => {
    const req = { method: 'POST', path: '/change-email', params: { email: 'attacker@evil.com' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })

  it('does not trigger when email is missing', () => {
    const req = { method: 'POST', path: '/change-email', params: { csrf_token: 'fake' } }
    const { triggered } = processRequest(initialState, req)
    expect(triggered).toBe(false)
  })
})
