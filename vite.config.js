import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Fine Bearing & Oil Seal Store',
          short_name: 'Fine Bearing',
          description: 'India\'s premium B2B industrial procurement hub for authentic bearings, oil seals, motors, V-belts & hydraulic equipment.',
          theme_color: '#0f172a',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['business', 'shopping'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [],
          shortcuts: [
            {
              name: 'Browse Products',
              short_name: 'Products',
              url: '/products',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'My Orders',
              short_name: 'Orders',
              url: '/orders',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Cache strategies for different resource types
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
          // Don't precache heavy brand images - they'll be cached at runtime
          globIgnores: ['**/assets/*-*.png', '**/assets/*-*.jpg'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
          runtimeCaching: [
            {
              // Cache API calls with NetworkFirst (fresh data preferred, fallback to cache offline)
              urlPattern: /^https:\/\/.*\/api\/(products|categories|brands)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache product images with CacheFirst (images rarely change)
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            },
            {
              // Cache Cloudinary / external CDN images
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cloudinary-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('lucide')) return 'vendor-icons';
              // Removed vendor-core catch-all per user specs
            }
          }
        }
      }
    },
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            // Inject the airoShareToken on every proxied request
            proxy.on('proxyReq', (proxyReq, req) => {
              const token = env.AIRO_SHARE_TOKEN;
              if (token) {
                const url = new URL(proxyReq.path, 'http://localhost');
                url.searchParams.set('airoShareToken', token);
                proxyReq.path = url.pathname + url.search;
              }
            });
          }
        }
      }
    },
    preview: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: true,
          configure: (proxy, options) => {
            // Inject the airoShareToken on every proxied request
            proxy.on('proxyReq', (proxyReq, req) => {
              const token = env.AIRO_SHARE_TOKEN;
              if (token) {
                const url = new URL(proxyReq.path, 'http://localhost');
                url.searchParams.set('airoShareToken', token);
                proxyReq.path = url.pathname + url.search;
              }
            });
          }
        }
      }
    }
  }
})
