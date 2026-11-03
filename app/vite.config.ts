import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The colour source of truth lives one folder up (ANTZ_colour_library.json),
// so the dev server must be allowed to read the parent folder.
const parent = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { fs: { allow: [parent] } },
});
