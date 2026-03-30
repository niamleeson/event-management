import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    conditions: ['source'],
  },
  server: {
    port: 3002,
    cors: true,
  },
})
