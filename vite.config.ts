import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The atlas and background are multi-megabyte PNGs; never inline them.
    assetsInlineLimit: 0,
  },
})
