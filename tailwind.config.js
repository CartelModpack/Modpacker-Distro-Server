export default {
  content: [
    "./web/views/**/*.{hbs,html}",
    "./web/public/js/*.{js,cjs}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#6a7e8b",
        "accent-light": "#7ac1c8",
      },
    },
  },
  plugins: [],
};
