import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- 1. IMPORT THIS

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 2. ADD THIS ENTIRE 'resolve' BLOCK
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})