import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
// singlefile: одна self-contained HTML-страница — удобно для превью и быстрой проверки.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
})
