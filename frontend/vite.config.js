import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev-only proxy: frontend runs on 5173, backend on 3001.
// In production both are served from the same Express app (see backend/server.js),
// so no proxy is needed there — this only matters for local development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/login': { target: 'http://localhost:3001', changeOrigin: true },
      '/logout': { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
