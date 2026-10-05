import path from "path"

export default {
  plugins: {
    // explicit path so builds work no matter which directory they start from
    tailwindcss: { config: path.join(import.meta.dirname, "tailwind.config.js") },
    autoprefixer: {},
  },
}
