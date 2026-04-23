/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',   // celulares pequenos (iPhone SE, Galaxy A)
        'sm': '640px',   // celulares grandes / landscape
        'md': '768px',   // tablets portrait
        'lg': '1024px',  // tablets landscape / laptops
        'xl': '1280px',  // desktops
        '2xl': '1536px', // monitores grandes
        'tv': '1920px',  // Full HD / Smart TVs
        '4k': '2560px',  // 4K / monitores ultra-wide
      },
      fontSize: {
        'tv-base': ['1.25rem', { lineHeight: '1.75rem' }],
        'tv-lg': ['1.5rem', { lineHeight: '2rem' }],
        'tv-xl': ['2rem', { lineHeight: '2.5rem' }],
        'tv-2xl': ['2.5rem', { lineHeight: '3rem' }],
        'tv-3xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        'tv': '120rem',
      },
    },
  },
  plugins: [],
}