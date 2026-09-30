import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// The API runs separately (server/). Proxying /api keeps it on the same
// origin as the app, so the session cookie just works.
const api = { '/api': process.env.API_URL || 'http://localhost:5000' }

export default defineConfig({
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api },
})
