import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Full hls.js adds HEVC MPEG-TS support and is loaded only for HLS playback.
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
