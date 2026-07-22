import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at /LEARN-TO-DIE/
export default defineConfig({
  base: '/LEARN-TO-DIE/',
  plugins: [react()],
});
