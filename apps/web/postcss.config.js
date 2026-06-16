// Tailwind v4 se integra como plugin de PostCSS (no necesita tailwind.config.js:
// la detección de clases y el theme son CSS-first vía `@import "tailwindcss"`).
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
