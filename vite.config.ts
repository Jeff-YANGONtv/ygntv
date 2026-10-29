import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the full HLS build (including subtitle support) lazy-loaded for playback.
    // Its current minified chunk is about 593 kB; keep the warning budget explicit.
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
