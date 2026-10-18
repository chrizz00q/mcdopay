
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/mcdopay/',

  server: {
    allowedHosts: [
      'generating-victoria-hitachi-tool.trycloudflare.com'
    ]
  },

  build: {
    chunkSizeWarningLimit: 1000,
  }
})
