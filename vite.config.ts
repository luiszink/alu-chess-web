import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Im Dev-Modus laufen die Backend-Services lokal auf eigenen Ports.
// Die Pfade /api/controller, /api/player, /api/perf, /api/model, /api/tournament,
// /api/lichess werden auf die jeweiligen Services weitergeleitet, damit das
// Frontend mit denselben relativen URLs arbeitet wie in der Docker-Variante.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/controller': { target: 'http://localhost:8081', changeOrigin: true, ws: false },
      '/api/player':     { target: 'http://localhost:8081', changeOrigin: true },
      '/api/perf':       { target: 'http://localhost:8081', changeOrigin: true },
      '/api/model':      { target: 'http://localhost:8082', changeOrigin: true },
      '/api/tournament': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/lichess':    { target: 'http://localhost:8085', changeOrigin: true },
    },
  },
})
