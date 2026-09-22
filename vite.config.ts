import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// Keep the Vite HTML source separate from the extension's compiled new-tab entry.
export default defineConfig({ plugins: [react(), tailwindcss()], publicDir: 'public', build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: 'build.html' } } })
