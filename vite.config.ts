import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Ensure stable chunk names for extensions
        manualChunks: {
          vendor: ['react', 'react-dom'],
          crypto: ['crypto-js']
        }
      }
    }
  },
  base: './',
  server: {
    // Prevent automatic opening of browser during dev
    open: false,
    hmr: {
      // Use a different port for HMR to avoid conflicts
      port: 5174
    }
  },
  // Optimize dependencies to prevent re-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'crypto-js', 'qrcode'],
    exclude: ['@crxjs/vite-plugin']
  }
});
