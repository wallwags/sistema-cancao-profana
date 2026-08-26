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
          obsidian: {
            base:     '#1C1D1F',
            deep:     '#131415',
            elevated: '#242019',
            ink:      '#131415',
          },
          bento: {
            coral:       '#FF8F7A',
            coralDark:   '#FF6B5B',
            periwinkle:  '#7A80FF',
            sage:        '#A3C0B8',
            amber:       '#FFCB57',
            snow:        '#F0EAE0',
            border:      'rgba(255,255,255,0.05)',
            borderHover: 'rgba(255,255,255,0.12)',
          },
        },
        borderRadius: {
          bento:        '32px',
          'bento-inner':'16px',
        },
        letterSpacing: {
          tightest: '-0.02em',
          widest:   '0.08em',
        },
        boxShadow: {
          bento:
            '0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.06)',
          'bento-hover':
            '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)',
        },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif']
      }
    },
  },
  plugins: [],
}
