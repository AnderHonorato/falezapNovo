import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso externo
    port: 5173,
    strictPort: true, // Garante que o Vite sempre use esta porta ou falhe
    allowedHosts: true, // Permite qualquer host (necessário para túneis como Cloudflare)
    
    // Configuração crucial para evitar erros de conexão e Bad Request no Túnel
    hmr: {
      clientPort: 443, // Força o cliente a tentar conectar o WebSocket via HTTPS (porta 443)
      host: 'localhost', // Mantém o host interno para o HMR
    },

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true // Suporte para WebSocket
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true // Suporte para WebSocket (essencial para o sistema de chat)
      }
    }
  }
})