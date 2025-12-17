import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,      // CHANGED: Match Docker port mapping
    host: true,      // CHANGED: Bind to 0.0.0.0 so Docker can expose it
    open: false,     // CHANGED: Disable auto-open in Docker environment
    watch: {
      usePolling: true, // CRITICAL: Ensures hot-reload works in Docker/WSL
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000', // CHANGED: Points to Docker Service 'backend'
        changeOrigin: true,
        secure: false,
      },
    },
  },
});