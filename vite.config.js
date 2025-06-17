import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/mcp-frontend/', // This is crucial for GitHub Pages
  build: {
    outDir: 'docs' // Build directly to docs folder
  }
})