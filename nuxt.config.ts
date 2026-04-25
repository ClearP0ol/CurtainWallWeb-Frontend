// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [process.env.NUXT_UI_PRO_PATH || '@nuxt/ui-pro'],
  modules: ['@nuxt/ui', '@nuxt/fonts', '@vueuse/nuxt', "@nuxt/image", '@element-plus/nuxt','@pinia/nuxt'],

  // plugins: [
  //   '~/plugins/cleanup.js'
  // ],
  ui: {
    global: true,
    icons: {
      dynamic: true,
      families: {
        heroicons: true,
        'simple-icons': true,
        'material-symbols': true
      }
    },
    colors: ['primary', 'red', 'orange', 'green']
  },

  devtools: { enabled: true },

  // 不开启服务端渲染
  ssr: false,

  nitro: {
    devProxy: {
      /**
       * 监控服务：由 server/middleware/00-m-api-proxy.ts 在 dev/prod 中统一用 proxyRequest 转发 /m-api → /api/v1
       * （仅依赖 devProxy 时，/m-api 在部分环境下会落到 Nuxt 应用 404，与 curl 直连后端不一致。）
       */
      '/api': {
        target: 'http://8.159.143.133:8000',
        changeOrigin: true,
      },
      '/predict': {
        target: 'http://47.102.208.89:8007',
        changeOrigin: true
      },
      '/history': {
        target: 'http://47.102.208.89:8007',
        changeOrigin: true
      },
      '/oss': {
        target: 'http://8.159.143.133:9000',
        changeOrigin: true,
      },
      '/crackdetection': {
        target: 'http://110.42.214.164:8001',
        //target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  },

  // 添加路由配置
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
  },

  compatibilityDate: '2024-12-17',

  // 确保环境变量在运行时可用
  runtimeConfig: {
    /** 仅服务端：/m-api 代理到监控服务时使用的上游根地址（与 frontend-api.md 中独立监控服务一致） */
    monitorServiceOrigin:
      process.env.NUXT_SERVER_MONITOR_UPSTREAM || "http://8.159.143.133:8080",
    public: {
      apiBase: process.env.NUXT_API_BASE_URL,
      /** 未设 serverMonitorBase 时，用此前缀走 dev 代理到监控服务，例如 /m-api/system/overview */
      serverMonitorApiPrefix: process.env.NUXT_PUBLIC_SERVER_MONITOR_PREFIX || "/m-api",
      /** 生产或直连时填写完整 API 基址（需含 /api/v1 后缀，不含尾部斜杠） */
      serverMonitorBase: process.env.NUXT_PUBLIC_SERVER_MONITOR_BASE || ""
    }
  },

  image: {
    /** 与 11 工程及当前各业务后端主机一致 */
    domains: ['8.159.143.133', '8.153.161.229', '110.42.214.164', '47.102.208.89']
  }
})
