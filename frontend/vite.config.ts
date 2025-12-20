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
    port: 5173,
    host: true,
    open: false,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'http://backend:8000' 
          : 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});