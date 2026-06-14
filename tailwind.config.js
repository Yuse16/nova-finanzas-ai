javascript
import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Add custom font families here
        // We'll define the CSS variables for these in globals.css
        inter: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        'roboto-mono': ['var(--font-roboto-mono)', ...defaultTheme.fontFamily.mono],
        system: ['var(--font-system)', ...defaultTheme.fontFamily.sans], // Fallback to sans-serif for system UI
      },
      colors: {
        // ... custom color definitions if any ...
      },
      // ... other theme extensions ...
    },
  },
  plugins: [],
}

export default config

