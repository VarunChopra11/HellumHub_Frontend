import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Required for the `mqtt` npm package to work in a browser/Vite context.
  // The mqtt package (and some of its dependencies) reference the Node.js
  // global `global` object; this shim maps it to the browser's `globalThis`.
  define: {
    global: 'globalThis',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
