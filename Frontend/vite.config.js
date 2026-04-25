import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: {},
  },
  server: {
    host: true,                // cho phép truy cập public
    allowedHosts: [
      "limpness-acting-eagle.ngrok-free.dev"
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // BE Spring Boot
        changeOrigin: true,
        secure: false,
        // KHÔNG rewrite: backend đã map /api/... nên giữ nguyên path
      },
    },
  },
})
