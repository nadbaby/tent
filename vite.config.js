import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
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
      host: true
    }
  }
})
