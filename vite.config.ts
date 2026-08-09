import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 须带尾部 /，避免 /n 误匹配 /node_modules、/a 误匹配 /assets
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/config': { target: 'http://localhost:8080', changeOrigin: true },
      '/p/': { target: 'http://localhost:8080', changeOrigin: true },
      '/u/': { target: 'http://localhost:8080', changeOrigin: true },
      '/a/': { target: 'http://localhost:8080', changeOrigin: true },
      '/n/': { target: 'http://localhost:8080', changeOrigin: true },
      '/g/': { target: 'http://localhost:8080', changeOrigin: true },
    }
  }
})

