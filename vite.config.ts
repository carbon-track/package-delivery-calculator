import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
// Preserve prior build artifacts; this repository forbids bulk deletion.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare({ inspectorPort: false })],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/')) {
            if (id.includes('/zod/')) return 'validation';
            if (id.includes('/framer-motion/') || id.includes('/motion-')) return 'motion';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/'))
              return 'react';
          }
        },
      },
    },
  },
});
