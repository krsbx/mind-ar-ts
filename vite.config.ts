import { defineConfig } from 'vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

export default defineConfig({
  define: {
    'process.env': process.env,
  },
  plugins: [viteCommonjs()],
  build: {
    rollupOptions: {
      plugins: [dynamicImportVars()],
    },
  },
});
