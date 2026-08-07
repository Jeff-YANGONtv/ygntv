import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://khaki-yak-457838.hostingersite.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
