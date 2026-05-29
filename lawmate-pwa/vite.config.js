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
        lang: 'en',
        dir: 'ltr',
        display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
        prefer_related_applications: false,
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=com.lawoncall.app',
            id: 'com.lawoncall.app'
          }
        ],
        iarc_rating_id: '12345678-90ab-cdef-1234-567890abcdef',
        categories: ['legal', 'utility'],
        launch_handler: {
          client_mode: 'focus-existing'
        },
        edge_side_panel: {
          preferred_width: 480
        },
        note_taking: {
          new_note_url: '/new-note'
        },
        scope_extensions: [
          { type: 'origin', origin: 'https://lawmate-jade.vercel.app' }
        ],
        share_target: {
          action: '/share',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        file_handlers: [
          {
            action: '/open-file',
            accept: {
              'application/pdf': ['.pdf'],
              'text/plain': ['.txt']
            },
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ],
            launch_type: 'single-client'
          }
        ],
        protocol_handlers: [
          {
            protocol: 'web+lawmate',
            url: '/?protocol=%s'
          }
        ],
        widgets: [
          {
            name: 'Lawoncall Widget',
            short_name: 'Lawoncall',
            description: 'Quick check of your legal inquiries',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ],
            ms_ac_template: '/widgets/consultation.json',
            data: '/widgets/data.json',
            type: 'application/json'
          }
        ],
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
        screenshots: [
          {
            src: '/screenshot-desktop.png',
            sizes: '1877x907',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Lawoncall Desktop'
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '440x782',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Lawoncall Mobile'
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

