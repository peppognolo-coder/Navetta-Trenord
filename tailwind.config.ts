/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Stessa palette di Supremi Advisor: verde Trenord ufficiale, non il
        // verde "bus" #69BE28 usato nella prima versione di questa app.
        'trenord-green': {
          DEFAULT: '#007A3D',
          light: '#00A050',
          dark: '#005C2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideInFromTop: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-from-top-1': 'slideInFromTop 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
