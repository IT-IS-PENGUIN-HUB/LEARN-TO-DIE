import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Tên file có ký tự ngoài ASCII in được (ảnh lịch học đặt tên tiếng Nhật)
const NON_ASCII = /[^ -~]/;

// GitHub Pages serves the site at /LEARN-TO-DIE/
export default defineConfig({
  base: '/LEARN-TO-DIE/',
  build: {
    rollupOptions: {
      output: {
        // Ảnh lịch học đặt tên tiếng Nhật ("8月2～8月30.jpg"). Giữ nguyên tên đó trong URL
        // thì phải percent-encode, dễ 404 trên Pages → file như vậy chỉ lấy hash làm tên.
        assetFileNames: (info) => {
          const name = info.names?.[0] ?? info.name ?? '';
          return NON_ASCII.test(name) ? 'assets/[hash][extname]' : 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
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
        // Precache app shell (js/css/html/font/icon) + ảnh lịch học (nhỏ, luôn cần offline)
        // — KHÔNG precache PDF đề (26MB) và PDF giáo trình (14MB)
        globPatterns: ['**/*.{js,mjs,css,html,png,svg,woff2,jpg,jpeg}'],
        globIgnores: ['pdfs/**', 'textbooks/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Giáo trình: cache riêng, không bị đề thi đẩy ra — đây là thứ ôn nhiều nhất trên tàu
            urlPattern: ({ url }) => url.pathname.includes('/textbooks/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'textbook-cache',
              expiration: { maxEntries: 12, maxAgeSeconds: 180 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
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
