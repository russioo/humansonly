import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff0fb',
          100: '#ffe4f7',
          200: '#ffc9ef',
          300: '#ffa3e3',
          400: '#f736dd',
          500: '#e91ed0',
          600: '#c218a8',
          700: '#9c1585',
          800: '#7a1268',
          900: '#5c0d4e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
