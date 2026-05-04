import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Accept Host headers from any tunnel URL (e.g. *.trycloudflare.com).
    // Without this, Vite blocks requests forwarded through the tunnel.
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
