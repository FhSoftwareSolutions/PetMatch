import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base: '/PetMatch/', // descomente se for publicar no GitHub Pages
})
