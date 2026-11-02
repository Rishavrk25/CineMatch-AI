import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on `mode` from .env
  const env = loadEnv(mode, process.cwd(), '');

  // Dynamically resolve backend proxy target from env
  let backendTarget = env.VITE_BACKEND_URL;
  if (!backendTarget && env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.startsWith('http')) {
    try {
      backendTarget = new URL(env.VITE_API_BASE_URL).origin;
    } catch {
      backendTarget = 'http://localhost:5000';
    }
  }
  backendTarget = backendTarget || 'http://localhost:5000';

  const port = parseInt(env.VITE_PORT || '5173', 10);

  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  };
});
