import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  base: './',
  resolve: mode === 'single' ? { alias: { 'virtual:pwa-register': '/src/pwa-stub.ts' } } : undefined,
  plugins: [
    react(),
    mode === 'single'
      ? viteSingleFile()
      : VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false,
          includeAssets: ['icon.svg', 'apple-touch-icon.png'],
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
            // Cache the pose model and its WASM after first use so swing analysis also works offline.
            runtimeCaching: [
              {
                urlPattern: ({ url }) => url.hostname === 'storage.googleapis.com' || (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('@mediapipe/tasks-vision')),
                handler: 'CacheFirst',
                options: { cacheName: 'pose-assets', expiration: { maxEntries: 10 }, cacheableResponse: { statuses: [0, 200] } },
              },
            ],
          },
          manifest: {
            name: 'SwingLog',
            short_name: 'SwingLog',
            description: 'จัดเซสชันฝึกกอล์ฟตามเวลาและอาการ',
            lang: 'th',
            theme_color: '#0B1210',
            background_color: '#0B1210',
            display: 'standalone',
            start_url: '.',
            icons: [
              { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
            ],
          },
        }),
  ],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
  test: { environment: 'node' },
}));
