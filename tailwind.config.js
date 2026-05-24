/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: { DEFAULT: '#E8C4C4', dark: '#C49090', deep: '#8B5C5C' },
        sage: { DEFAULT: '#C4D4C4', dark: '#8FA88F' },
        cream: { DEFAULT: '#FAF7F2', dark: '#F0EBE1' },
        gold: { DEFAULT: '#C9A84C', light: '#E8D5A0' },
        mauve: { DEFAULT: '#B09AC0', light: '#D4C4E0' },
        text: { DEFAULT: '#2C2320', mid: '#6B5B55', light: '#A0918C' },
        border: '#EDE8E0',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
