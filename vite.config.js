import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site at /LEARN-TO-DIE/
export default defineConfig({
  base: '/LEARN-TO-DIE/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'LEARN TO DIE',
        short_name: 'LEARN',
        description: 'Ôn thi 技術士補 — luyện đề PDF và học từ vựng SRS',
        lang: 'vi',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache app shell (js/css/html/font/icon) — KHÔNG precache PDF (26MB)
        globPatterns: ['**/*.{js,mjs,css,html,png,svg,woff2}'],
        globIgnores: ['pdfs/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Đề PDF: cache sau lần xem đầu → mở lại được khi offline (trên tàu)
            urlPattern: ({ url }) => url.pathname.includes('/pdfs/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
