/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#4DBCCC', light: '#58cee0ff', dark: '#2E9BAE' },
        navy:  { DEFAULT: '#0D1B2A', light: '#1A2E42' },
        cta:   { DEFAULT: '#E8365D', dark: '#C42B4E' },
      },
      fontFamily: {
        brand: ['Outfit', 'Inter', 'sans-serif'],
        body:  ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 8px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [forms, animate],
}
