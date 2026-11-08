import { build, defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** MediaPipe 0.10.14 uses importScripts for its WASM loader. Vite's dev
 * workers are modules, so serve a bundled classic worker at one fixed URL. */
function classicPoseWorkerDev(): Plugin {
  let bundle: Promise<string> | undefined;
  return {
    name: 'swinglog-classic-pose-worker', apply: 'serve',
    configureServer(server) {
      server.watcher.on('change', path => { if (/pose(?:\.worker)?\.ts$/.test(path)) bundle = undefined; });
      server.middlewares.use('/__swinglog_pose_worker.js', async (_req, res) => {
        try {
          bundle ??= build({ configFile: false, logLevel: 'silent', build: { write: false, minify: true,
            lib: { entry: fileURLToPath(new URL('./src/pose.worker.ts', import.meta.url)), name: 'SwingLogPoseWorker', formats: ['iife'] },
          } }).then(result => {
            const outputs = Array.isArray(result) ? result : [result];
            for (const output of outputs) if ('output' in output) for (const chunk of output.output) if (chunk.type === 'chunk') return chunk.code;
            throw new Error('No worker bundle');
          });
          res.setHeader('Content-Type', 'application/javascript'); res.setHeader('Cache-Control', 'no-store'); res.end(await bundle);
        } catch { bundle = undefined; res.statusCode = 500; res.end('/* Worker build failed */'); }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: './',
  resolve: mode === 'single' ? { alias: { 'virtual:pwa-register': '/src/pwa-stub.ts' } } : undefined,
  plugins: [
    react(),
    classicPoseWorkerDev(),
    mode === 'single'
      ? viteSingleFile()
      : VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false,
          includeAssets: ['icon.svg', 'apple-touch-icon.png'],
          workbox: {
            clientsClaim: true,
            globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
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
            description: 'คู่มือฝึกกอล์ฟทีละขั้น วางแผนซ้อมและดูวงสวิง',
            lang: 'th',
            theme_color: '#205B3E',
            background_color: '#F7F7F0',
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
