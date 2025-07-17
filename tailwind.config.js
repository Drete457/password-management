/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './sidepanel.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'themed': {
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          'border-primary': 'var(--border-primary)',
          'border-secondary': 'var(--border-secondary)',
          'accent-50': 'var(--accent-50)',
          'accent-100': 'var(--accent-100)',
          'accent-500': 'var(--accent-500)',
          'accent-600': 'var(--accent-600)',
          'accent-700': 'var(--accent-700)',
        }
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      }
    },
  },
  plugins: [],
};
