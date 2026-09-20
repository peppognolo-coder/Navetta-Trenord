import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
      ],

      manifest: {
        name: 'Navetta Trenord',
        short_name: 'Navetta Trenord',
        description: 'Orari navetta Trenord per il personale — Greco/Garibaldi ↔ Rho Fiera',

        // Stesso trenord-green della palette Tailwind e di Supremi Advisor
        theme_color: '#007A3D',
        background_color: '#007A3D',

        display: 'standalone',
        orientation: 'portrait',

        scope: '/',
        start_url: '/',

        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
