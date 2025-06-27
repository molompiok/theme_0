//vite.config.ts
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import { defineConfig, UserConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(), vike(), tailwindcss()],
  server: {
    allowedHosts:true,
    port: 3010, 
    hmr: {
      port: 24700,
    },
  },
})