import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The API the dev server proxies to, so the browser makes same-origin calls.
// In Docker that is another service on the compose network.
const BACKEND_URL = process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:8080'

// Bind mounts do not deliver file events on macOS, so watching must poll
const USE_POLLING = process.env.VITE_USE_POLLING === 'true'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: { usePolling: USE_POLLING },
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/env.d.ts'],
      reporter: ['text'],
    },
  },
})
