export default defineNuxtConfig({
  compatibilityDate: "2026-09-29",
  devtools: { enabled: false },

  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxtjs/i18n"],

  tailwindcss: {
    configPath: "~~/tailwind.config.ts",
    cssPath: "~~/assets/css/main.css",
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
      // strapiUrl: "http://10.22.0.180:1337",
    },

    strapiToken: "",
    strapiUrl: "http://localhost:1337",
    // strapiUrl: "http://10.22.0.180:1337",
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "anonymous",
        },
        // Display serif (font-serif) + body sans (font-sans) — nạp cả subset
        // vietnamese + latin; Afacad Flux không có trục italic.
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Afacad+Flux:wght@100..1000&display=swap",
        },
        { rel: "icon", type: "image/jpeg", href: "/logo.jpg" },
      ],
    },
  },
});
