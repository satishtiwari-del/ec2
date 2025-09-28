import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/excalidraw/',
  build: { outDir: 'dist' },
  server: {
    port: 5173,
    proxy: {
      '/wopi': {
        target: 'http://localhost:3000',
        changeOrigin: false
      }
    }
  }
});


