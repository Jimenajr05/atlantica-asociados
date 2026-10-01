/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'azul-rey': {
          DEFAULT: 'var(--color-azul-rey)',
          dark: 'var(--color-azul-rey-dark)',
          50: '#f0f4f9',
          100: '#e1e9f3',
          200: '#c3d3e7',
          300: '#94b3d7',
          400: '#5e8cc4',
          500: '#396bb0',
          600: 'var(--color-azul-rey)',
          700: 'var(--color-azul-rey-dark)',
          800: '#0c1b33',
          900: '#081224',
        },
        blanco: {
          DEFAULT: 'var(--color-blanco)',
          pure: '#ffffff',
          soft: '#fafafc',
          muted: '#f1f5f9',
        },
        negro: {
          DEFAULT: 'var(--color-negro)',
          surface: '#0d1117',
          border: '#1e2638',
        },
        dorado: {
          DEFAULT: 'var(--color-dorado)',
          light: '#dfc785',
          hover: 'var(--color-dorado-hover)',
          muted: '#a38138',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        heading: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'clean': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 14px 0 rgba(15, 23, 42, 0.06)',
        'card-hover': '0 10px 25px -3px rgba(22, 54, 100, 0.1), 0 4px 6px -2px rgba(22, 54, 100, 0.05)',
      },
    },
  },
  plugins: [],
};
