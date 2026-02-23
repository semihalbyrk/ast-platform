import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            25: '#fbfdff',
            50: '#f7faff',
            100: '#f5f7ff',
            200: '#e2e7f5',
            300: '#c8cee0',
            400: '#adb4cb',
            500: '#878ea8',
            600: '#535a72',
            700: '#414f6a',
            800: '#2f4362',
            900: '#0b2b51',
          },
          green: {
            25: '#e1f5e0',
            50: '#c3ebc0',
            100: '#a4e2a1',
            200: '#86d882',
            300: '#68ce62',
            400: '#4ac443',
            500: '#3ba935',
            600: '#369b31',
            700: '#318d2c',
            800: '#2c7f28',
            900: '#277123',
          },
        },
        grey: {
          25: '#fcfcfd',
          50: '#f9fafb',
          100: '#f2f4f7',
          200: '#eaecf0',
          300: '#d0d5dd',
          400: '#98a2b3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1d2939',
          900: '#101828',
        },
        green: {
          25: '#e1f5e0',
          50: '#c3ebc0',
          300: '#68ce62',
          400: '#4ac443',
          500: '#3ba935',
          600: '#369b31',
          700: '#318d2c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        sm: '0 1px 3px rgba(16, 24, 40, 0.08)',
        md: '0 4px 8px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        lg: '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
