export default defineNuxtConfig({
  compatibilityDate: "2026-09-29",
  devtools: { enabled: false },

  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxtjs/i18n"],

  tailwindcss: {
    configPath: "~~/tailwind.config.ts",
  },

  i18n: {
    defaultLocale: "en",
    strategy: "prefix", // "prefix_except_default"
    locales: [
      { code: "en", language: "en-US", name: "EN" },
      { code: "vi", language: "vi-VN", name: "VI" },
    ],
  },

  runtimeConfig: {
    public: {
      strapiUrl: "http://localhost:1337",
    },

    strapiToken: "",
    strapiUrl: "http://localhost:1337",
  },

  app: {
    head: {
      link: [{ rel: "icon", type: "image/jpeg", href: "/logo.jpg" }],
    },
  },
});
