// tailwind.config.js
const themeConfig = require('./theme.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
      colors: {
        themePrimary: themeConfig.colors.primary,
        themeBg: themeConfig.colors.background,
        themeAccent: themeConfig.colors.accent,
        themeText: themeConfig.colors.text,
        themeBadge: themeConfig.colors.badge,
      },
      fontFamily: {
        sans: themeConfig.typography.fontFamily.sans,
      },
      borderRadius: {
        'theme-sm': themeConfig.borderRadius.sm,
        'theme-md': themeConfig.borderRadius.md,
        'theme-lg': themeConfig.borderRadius.lg,
        'theme-xl': themeConfig.borderRadius.xl,
      },
    },
  },
  plugins: [],
};