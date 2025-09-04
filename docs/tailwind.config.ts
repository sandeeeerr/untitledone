import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/nextra-theme-docs/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config


