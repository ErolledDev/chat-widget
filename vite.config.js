import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        chat: './src/chat.js'
      },
      output: {
        entryFileNames: chunkInfo => {
          return chunkInfo.name === 'chat' ? 'chat.js' : '[name].[hash].js';
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        format: 'es',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-hot-toast', 'react-colorful', '@heroicons/react'],
          supabase: ['@supabase/supabase-js'],
          ai: ['@google/generative-ai']
        }
      }
    },
    target: 'es2015',
    minify: 'terser',
    sourcemap: false
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  }
});