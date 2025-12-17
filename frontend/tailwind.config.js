/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB', // Professional Blue
        secondary: '#1E293B', // Slate Dark
        accent: '#F59E0B', // Amber for Call-to-actions
      }
    },
  },
  plugins: [],
}