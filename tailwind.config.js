/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        active: '#16a34a',
        overload: '#ea580c',
        failure: '#dc2626',
      },
    },
  },
  plugins: [],
};

