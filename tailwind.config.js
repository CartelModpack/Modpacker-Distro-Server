export default {
  content: [
    "./web/views/**/*.{hbs,html}",
    "./web/public/js/**/*.{js,cjs}",
    "./web/md/**/*.md",
    "./src/styles/**/*.css",
    "./README.md",
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
