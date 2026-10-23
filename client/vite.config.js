
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(clientDir, '..');
const FALLBACK_SITE_URL = 'http://localhost:5173';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectDir, '');

  const siteUrl = (
    process.env.SITE_URL ||
    env.SITE_URL ||
    FALLBACK_SITE_URL
  ).replace(/\/+$/, '');

  return {
    plugins: [
      react(),
      {
        name: 'saffron-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl);
        },
      },
    ],

    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,

      // Allows changing Cloudflare Quick Tunnel hostnames.
      // Use only for temporary development.
      allowedHosts: true,

      // Do not let Vite's dev-server CORS middleware answer API preflights.
      // Its default localhost-only policy returns 204 without ACAO for tunnel
      // origins. Express enforces the exact CLIENT_URL/CLIENT_ORIGINS allowlist.
      // Same-origin Vite assets do not need CORS.
      cors: false,

      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          // Rewrites Host to the API target. It does not rewrite the browser's
          // Origin header, so the API must allow the current tunnel origin via
          // CLIENT_ORIGINS.
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
