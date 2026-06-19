import '@testing-library/jest-dom'

// jsdom does not implement IntersectionObserver (used by Framer Motion whileInView).
// Provide a no-op stub so components that use viewport-triggered animations render
// without throwing.
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
