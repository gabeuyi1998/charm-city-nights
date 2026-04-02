/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF5C00',
        secondary: '#E9C349',
        background: '#131313',
        surface: '#1A1A1A',
        muted: '#2A2A2A',
      },
      fontFamily: {
        display: ['Manrope_800ExtraBold'],
        body: ['Manrope_400Regular'],
        bold: ['Manrope_700Bold'],
      },
    },
  },
  plugins: [],
};
