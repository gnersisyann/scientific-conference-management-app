// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiAuth: process.env.NUXT_PUBLIC_API_AUTH,
      apiUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
})
