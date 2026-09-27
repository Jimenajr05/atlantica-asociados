export default {
  content: [
    "./index.html",
    "./src/**/*.{js,css,html}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "atlantica-base": "#070a12",
        "atlantica-surface": "#0d1322",
        "atlantica-card": "rgba(15, 22, 36, 0.85)",
        "gold-primary": "#d4af37",
        "gold-light": "#fbe6a2",
        "gold-soft": "#ecd28a",
        "gold-dark": "#997525",
        "gold-bronze": "#755513",
      },
      fontFamily: {
        serif: ["Cinzel", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        quote: ["Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
