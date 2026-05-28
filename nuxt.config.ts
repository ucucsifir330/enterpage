export default defineNuxtConfig({
  compatibilityDate: "2026-05-28",
  css: ["~/main.css"],
  devtools: { enabled: false },
  app: {
    head: {
      htmlAttrs: { lang: "tr" },
      title: "Kardoor Entrance Showroom",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1"
        }
      ]
    }
  }
});
