import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    host: true, // Listen on all local IPs
    strictPort: true,
    allowedHosts: true, 
    proxy: {
      '/api': { 
        target: 'http://localhost:5001', 
        changeOrigin: true,
        secure: false
      }
    }
  }
})
