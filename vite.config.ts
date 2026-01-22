import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/bikes': {
        target: 'https://gbfs.partners.fifteen.eu/gbfs/2.2/landerneau/en',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bikes/, ''),
        secure: false, // Accepter les certificats auto-signés si jamais
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tomtom-international')) {
              return 'tomtom';
            }
            if (id.includes('react') || id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});