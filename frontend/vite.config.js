import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://learningmanagementsystem-2-bj3z.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path
      }
    },
    cors: true
  },
  build: {
    // Generate source maps for better debugging
    sourcemap: true
  }
})
