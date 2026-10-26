/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // En desarrollo /api se reenvía al backend: el navegador ve un solo origen,
  // así la cookie de sesión y la cookie CSRF funcionan igual que en producción.
  const backend = env.VITE_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: backend },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: backend },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
