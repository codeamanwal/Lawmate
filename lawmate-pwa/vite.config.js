import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        id: '/',
        name: 'Lawoncall.com',
        short_name: 'Lawoncall.com',
        description: 'Connect with expert lawyers in minutes for reliable legal advice.',
        theme_color: '#863bff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['legal', 'utility'],
        shortcuts: [
          {
            name: 'Start Case',
            short_name: 'Start Case',
            description: 'Start a new legal case consultation',
            url: '/get-started',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'My Bookings',
            short_name: 'Bookings',
            description: 'View your active and past consultations',
            url: '/my-bookings',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})

