import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      env: {
        /*
         * The investment mutation handler refuses any request with no verified
         * caller, which is correct — bare actorUid spoofing is precisely what
         * it guards against. Its acceptance suite calls the handler directly
         * with a plain object, so without this flag every case returns 401 and
         * eight tests fail for a reason unrelated to what they assert.
         *
         * Set here rather than in an npm script because `VAR=x vitest` is not
         * portable to a Windows shell, and a suite that only passes when run a
         * particular way is a suite people stop running.
         */
        INVESTMENT_ALLOW_TEST_AUTH: 'true',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      allowedHosts: true as true,
    },
  };
});
