// vite.config.js
import { defineConfig } from "file:///D:/Prorgram/CloneProject/Aman/Lawmate/lawmate-pwa/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Prorgram/CloneProject/Aman/Lawmate/lawmate-pwa/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///D:/Prorgram/CloneProject/Aman/Lawmate/lawmate-pwa/node_modules/@tailwindcss/vite/dist/index.mjs";
import { VitePWA } from "file:///D:/Prorgram/CloneProject/Aman/Lawmate/lawmate-pwa/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      devOptions: {
        enabled: true
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        id: "/",
        name: "Lawoncall.com",
        short_name: "Lawoncall.com",
        description: "Connect with expert lawyers in minutes for reliable legal advice.",
        theme_color: "#863bff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "en",
        dir: "ltr",
        display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
        prefer_related_applications: false,
        related_applications: [
          {
            platform: "play",
            url: "https://play.google.com/store/apps/details?id=com.lawoncall.app",
            id: "com.lawoncall.app"
          }
        ],
        iarc_rating_id: "12345678-90ab-cdef-1234-567890abcdef",
        categories: ["legal", "utility"],
        launch_handler: {
          client_mode: "focus-existing"
        },
        edge_side_panel: {
          preferred_width: 480
        },
        note_taking: {
          new_note_url: "/new-note"
        },
        scope_extensions: [
          { type: "origin", origin: "https://lawmate-jade.vercel.app" }
        ],
        share_target: {
          action: "/share",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        },
        file_handlers: [
          {
            action: "/open-file",
            accept: {
              "application/pdf": [".pdf"],
              "text/plain": [".txt"]
            },
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png"
              }
            ],
            launch_type: "single-client"
          }
        ],
        protocol_handlers: [
          {
            protocol: "web+lawmate",
            url: "/?protocol=%s"
          }
        ],
        widgets: [
          {
            name: "Lawoncall Widget",
            short_name: "Lawoncall",
            description: "Quick check of your legal inquiries",
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
                type: "image/png"
              }
            ],
            ms_ac_template: "/widgets/consultation.json",
            data: "/widgets/data.json",
            type: "application/json"
          }
        ],
        shortcuts: [
          {
            name: "Start Case",
            short_name: "Start Case",
            description: "Start a new legal case consultation",
            url: "/get-started",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "My Bookings",
            short_name: "Bookings",
            description: "View your active and past consultations",
            url: "/my-bookings",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
          }
        ],
        screenshots: [
          {
            src: "/screenshot-desktop.png",
            sizes: "1877x907",
            type: "image/png",
            form_factor: "wide",
            label: "Lawoncall Desktop"
          },
          {
            src: "/screenshot-mobile.png",
            sizes: "440x782",
            type: "image/png",
            form_factor: "narrow",
            label: "Lawoncall Mobile"
          }
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9yZ3JhbVxcXFxDbG9uZVByb2plY3RcXFxcQW1hblxcXFxMYXdtYXRlXFxcXGxhd21hdGUtcHdhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxQcm9yZ3JhbVxcXFxDbG9uZVByb2plY3RcXFxcQW1hblxcXFxMYXdtYXRlXFxcXGxhd21hdGUtcHdhXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Qcm9yZ3JhbS9DbG9uZVByb2plY3QvQW1hbi9MYXdtYXRlL2xhd21hdGUtcHdhL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgdGFpbHdpbmRjc3MoKSxcclxuICAgIFZpdGVQV0Eoe1xyXG4gICAgICByZWdpc3RlclR5cGU6ICdwcm9tcHQnLFxyXG4gICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgZW5hYmxlZDogdHJ1ZVxyXG4gICAgICB9LFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uaWNvJywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJywgJ3B3YS0xOTJ4MTkyLnBuZycsICdwd2EtNTEyeDUxMi5wbmcnXSxcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcclxuICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcclxuICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgaWQ6ICcvJyxcclxuICAgICAgICBuYW1lOiAnTGF3b25jYWxsLmNvbScsXHJcbiAgICAgICAgc2hvcnRfbmFtZTogJ0xhd29uY2FsbC5jb20nLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29ubmVjdCB3aXRoIGV4cGVydCBsYXd5ZXJzIGluIG1pbnV0ZXMgZm9yIHJlbGlhYmxlIGxlZ2FsIGFkdmljZS4nLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzg2M2JmZicsXHJcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcclxuICAgICAgICBzY29wZTogJy8nLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxyXG4gICAgICAgIGxhbmc6ICdlbicsXHJcbiAgICAgICAgZGlyOiAnbHRyJyxcclxuICAgICAgICBkaXNwbGF5X292ZXJyaWRlOiBbJ3N0YW5kYWxvbmUnLCAnd2luZG93LWNvbnRyb2xzLW92ZXJsYXknLCAnbWluaW1hbC11aSddLFxyXG4gICAgICAgIHByZWZlcl9yZWxhdGVkX2FwcGxpY2F0aW9uczogZmFsc2UsXHJcbiAgICAgICAgcmVsYXRlZF9hcHBsaWNhdGlvbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGxhdGZvcm06ICdwbGF5JyxcclxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9wbGF5Lmdvb2dsZS5jb20vc3RvcmUvYXBwcy9kZXRhaWxzP2lkPWNvbS5sYXdvbmNhbGwuYXBwJyxcclxuICAgICAgICAgICAgaWQ6ICdjb20ubGF3b25jYWxsLmFwcCdcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGlhcmNfcmF0aW5nX2lkOiAnMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmJyxcclxuICAgICAgICBjYXRlZ29yaWVzOiBbJ2xlZ2FsJywgJ3V0aWxpdHknXSxcclxuICAgICAgICBsYXVuY2hfaGFuZGxlcjoge1xyXG4gICAgICAgICAgY2xpZW50X21vZGU6ICdmb2N1cy1leGlzdGluZydcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVkZ2Vfc2lkZV9wYW5lbDoge1xyXG4gICAgICAgICAgcHJlZmVycmVkX3dpZHRoOiA0ODBcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5vdGVfdGFraW5nOiB7XHJcbiAgICAgICAgICBuZXdfbm90ZV91cmw6ICcvbmV3LW5vdGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzY29wZV9leHRlbnNpb25zOiBbXHJcbiAgICAgICAgICB7IHR5cGU6ICdvcmlnaW4nLCBvcmlnaW46ICdodHRwczovL2xhd21hdGUtamFkZS52ZXJjZWwuYXBwJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBzaGFyZV90YXJnZXQ6IHtcclxuICAgICAgICAgIGFjdGlvbjogJy9zaGFyZScsXHJcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAndGl0bGUnLFxyXG4gICAgICAgICAgICB0ZXh0OiAndGV4dCcsXHJcbiAgICAgICAgICAgIHVybDogJ3VybCdcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGZpbGVfaGFuZGxlcnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnL29wZW4tZmlsZScsXHJcbiAgICAgICAgICAgIGFjY2VwdDoge1xyXG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9wZGYnOiBbJy5wZGYnXSxcclxuICAgICAgICAgICAgICAndGV4dC9wbGFpbic6IFsnLnR4dCddXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3JjOiAnL3B3YS0xOTJ4MTkyLnBuZycsXHJcbiAgICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGxhdW5jaF90eXBlOiAnc2luZ2xlLWNsaWVudCdcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIHByb3RvY29sX2hhbmRsZXJzOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHByb3RvY29sOiAnd2ViK2xhd21hdGUnLFxyXG4gICAgICAgICAgICB1cmw6ICcvP3Byb3RvY29sPSVzJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgd2lkZ2V0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnTGF3b25jYWxsIFdpZGdldCcsXHJcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdMYXdvbmNhbGwnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1F1aWNrIGNoZWNrIG9mIHlvdXIgbGVnYWwgaW5xdWlyaWVzJyxcclxuICAgICAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzcmM6ICcvcHdhLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgbXNfYWNfdGVtcGxhdGU6ICcvd2lkZ2V0cy9jb25zdWx0YXRpb24uanNvbicsXHJcbiAgICAgICAgICAgIGRhdGE6ICcvd2lkZ2V0cy9kYXRhLmpzb24nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYXBwbGljYXRpb24vanNvbidcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIHNob3J0Y3V0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnU3RhcnQgQ2FzZScsXHJcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdTdGFydCBDYXNlJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTdGFydCBhIG5ldyBsZWdhbCBjYXNlIGNvbnN1bHRhdGlvbicsXHJcbiAgICAgICAgICAgIHVybDogJy9nZXQtc3RhcnRlZCcsXHJcbiAgICAgICAgICAgIGljb25zOiBbeyBzcmM6ICcvcHdhLTE5MngxOTIucG5nJywgc2l6ZXM6ICcxOTJ4MTkyJywgdHlwZTogJ2ltYWdlL3BuZycgfV1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdNeSBCb29raW5ncycsXHJcbiAgICAgICAgICAgIHNob3J0X25hbWU6ICdCb29raW5ncycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmlldyB5b3VyIGFjdGl2ZSBhbmQgcGFzdCBjb25zdWx0YXRpb25zJyxcclxuICAgICAgICAgICAgdXJsOiAnL215LWJvb2tpbmdzJyxcclxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJy9wd2EtMTkyeDE5Mi5wbmcnLCBzaXplczogJzE5MngxOTInLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc2NyZWVuc2hvdHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL3NjcmVlbnNob3QtZGVza3RvcC5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzE4Nzd4OTA3JyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIGZvcm1fZmFjdG9yOiAnd2lkZScsXHJcbiAgICAgICAgICAgIGxhYmVsOiAnTGF3b25jYWxsIERlc2t0b3AnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICcvc2NyZWVuc2hvdC1tb2JpbGUucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc0NDB4NzgyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICAgIGZvcm1fZmFjdG9yOiAnbmFycm93JyxcclxuICAgICAgICAgICAgbGFiZWw6ICdMYXdvbmNhbGwgTW9iaWxlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL3B3YS0xOTJ4MTkyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL3B3YS01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfVxyXG4gICAgfSlcclxuICBdLFxyXG59KVxyXG5cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVixTQUFTLG9CQUFvQjtBQUM5VyxPQUFPLFdBQVc7QUFDbEIsT0FB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
