import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    mode === 'single'
      ? viteSingleFile()
      : VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg'],
          manifest: {
            name: 'SwingLog',
            short_name: 'SwingLog',
            description: 'จัดเซสชันฝึกกอล์ฟตามเวลาและอาการ',
            lang: 'th',
            theme_color: '#1F6B3A',
            background_color: '#F6F8F3',
            display: 'standalone',
            start_url: '.',
            icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
          },
        }),
  ],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
  test: { environment: 'node' },
}));
