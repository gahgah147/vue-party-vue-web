import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      vue({
        template: { transformAssetUrls }
      }),

      quasar({
        sassVariables: 'src/style/quasar-variables.sass'
      }),

      basicSsl(),
    ],
    server: {
      https: true,
      proxy: {
        '/socket.io': {
          target: 'ws://vue-party-nestjs-server.vercel.app/socket.io',
          ws: true
        }
      }
    }
  }
})