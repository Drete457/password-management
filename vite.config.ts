import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx, defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: "SecurePass Analytics - Smart Password Manager",
  description: "Smart password manager with security analytics, breach detection, strength scoring, QR sharing, and comprehensive password health dashboard.",
  version: "0.1.0",
  permissions: [
    "sidePanel",
    "storage",
    "activeTab"
  ],
  host_permissions: [
    "<all_urls>",
    "https://api.pwnedpasswords.com/*"
  ],
  action: {
    default_title: "Open Password Manager"
  },
  side_panel: {
    default_path: "sidepanel.html"
  },
  background: {
    service_worker: "src/background/background.ts"
  }
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174
    }
  }
});
