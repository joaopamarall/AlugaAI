import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  srcDir: 'app',                 // sua fonte está dentro de /app
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['@/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],    // ✅ Tailwind v4
  },
})
