import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge', 'react-colorful'],
          utils: ['date-fns', 'uuid', 'jspdf', 'jszip', 'papaparse', 'js-yaml', 'diff'],
          code: ['react-syntax-highlighter', 'sql-formatter', 'xml-formatter', 'prettier'],
          pdf: ['pdfjs-dist', 'pdf-lib']
        }
      }
    }
  }
})
