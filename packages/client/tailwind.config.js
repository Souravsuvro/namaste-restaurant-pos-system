/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: '#E8731A',
        indigo: '#1B3A6B',
        navy: '#0F1F3D',
        gold: '#D4A843',
        tandoori: '#C23B22',
        cream: '#FDF6EC',
        charcoal: '#2D2926',
        sand: '#F5EDE0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
