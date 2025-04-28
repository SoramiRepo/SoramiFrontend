import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'apple-touch-icon.png',
        'apple-touch-icon-precomposed.png',
        'resource/icons/dev.svg',
        'resource/icons/verified.svg',
        'resource/logo.png',
        'resource/default-avatar.png',
        'resource/flags/*'
      ],
      manifest: {
        name: 'Sorami',
        short_name: 'Sorami',
        description: 'A simple social platform',
        theme_color: '#F3F4F6',
        background_color: '#F3F4F6',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: true,
    }),
  ],
});
