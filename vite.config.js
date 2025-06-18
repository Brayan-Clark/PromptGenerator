import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Configuration du serveur de développement
    server: {
      port: 3000,
      open: true,
      strictPort: true,
      host: true,
    },

    // Configuration de la prévisualisation
    preview: {
      port: 3000,
      open: true,
      strictPort: true,
    },

    // Configuration de la construction
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'terser' : false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['@headlessui/vue', '@heroicons/vue'],
          },
        },
      },
    },

    // Configuration des plugins
    plugins: [

      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('swiper-'),
          },
        },
      }),
      
      // Configuration PWA
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'PromptGen',
          short_name: 'PromptGen',
          description: 'Générateur de prompts IA',
          theme_color: '#7c3aed',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),

      // Configuration HTML
      createHtmlPlugin({
        minify: mode === 'production',
        inject: {
          data: {
            title: 'PromptGen - Générateur de Prompts IA',
            description: 'Générez des prompts optimisés pour les IA comme ChatGPT, Claude et autres modèles de langage',
            keywords: 'IA, prompt, générateur, ChatGPT, Claude, intelligence artificielle',
            themeColor: '#7c3aed',
          },
        },
      }),
    ],

    // Configuration des alias
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      },
    },

    // Configuration CSS
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/assets/styles/variables.scss";
            @import "@/assets/styles/mixins.scss";
          `,
        },
      },
    },

    // Configuration des variables d'environnement
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'PromptGen'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || 'development'),
    },
  };
});
