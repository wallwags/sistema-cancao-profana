/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vstBg: '#05070B',       /* Dark Navy background */
        vstPanel: '#0B0F19',    /* Matte-blue/navy glass cards */
        goldAccent: '#E3B552',  /* Main Dribbble gold accent */
        goldLight: '#FFF2D4',   /* Shimmer highlighting gold */
        goldMedium: '#F0C265',  /* Medium core gold */
        goldDark: '#B88A28',    /* Dark brass gold */
        lime: '#10B981',        /* Success indicators */
        coral: '#FF4B2E',       /* Alerts */
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    },
  },
  plugins: [],
}
