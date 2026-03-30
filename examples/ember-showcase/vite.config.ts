import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  server: {
    port: 3005,
    cors: true,
  },
})
