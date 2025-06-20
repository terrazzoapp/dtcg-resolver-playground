import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      cssModules: {
        grid: false,
      },
    },
  },
  test: {
    environment: 'node',
  },
});
