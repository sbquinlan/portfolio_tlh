import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/rebalance/',
  server: {
    proxy: {
      '/flex': {
        target: 'https://ndcdyn.interactivebrokers.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/flex/, ''),
      }
    }
  }
});
