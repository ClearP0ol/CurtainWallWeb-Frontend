// nuxt.config.ts
export default defineNuxtConfig({
  extends: [process.env.NUXT_UI_PRO_PATH || '@nuxt/ui-pro'],
  modules: ['@nuxt/ui', '@nuxt/fonts', '@vueuse/nuxt', "@nuxt/image", '@element-plus/nuxt', '@pinia/nuxt'],
  // plugins: [
  //   '~/plugins/cleanup.js'
  // ],
  ui: {
    icons: ['heroicons', 'simple-icons', 'material-symbols'],
    safelistColors: ['primary', 'red', 'orange', 'green'],
  },
  devtools: { enabled: true },
  ssr: false, // 不开启服务端渲染
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8080', // 配置后端 API 的基础 URL
      openaiApiKey: process.env.OPENAI_API_KEY || 'sk-Q012GL505WbC7hbQJeyr7zExYW8p9vt3sn4isE5sYiN1EgWS',
      openaiApiBase: process.env.OPENAI_API_BASE || 'https://api.chatanywhere.org/v1',
    },
  },
  nitro: {
    devProxy: {
      '/api/account': {
        target: 'http://111.231.168.12:8000/account',
        changeOrigin: true,
      },
      '/stonedirty': {
        target: 'http://111.231.168.12:8090',
        changeOrigin: true,
      },
      // 添加 Django API 代理
      '/api': {
        target: 'http://localhost:8080', // Django 后端的地址
        changeOrigin: true,
      },
      '/openai': {
        target: 'https://api.chatanywhere.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openai/, '/v1'),
      },
    },
  },
});
