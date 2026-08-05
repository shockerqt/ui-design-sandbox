import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    host: true,
  },
  // Solo para verificación local del bundle. En producción Nginx sirve dist/
  // directamente (ver deploy.sh), no `vite preview`.
  preview: {
    port: 8081,
    host: true,
    allowedHosts: true,
  },
});
