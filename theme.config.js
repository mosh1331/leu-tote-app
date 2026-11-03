// theme.config.js
module.exports = {
  colors: {
    primary: {
      DEFAULT: '#98A78F', // Charcoal
      hover: '#1A202C',
      light: '#4A5568',
    },
    background: {
      screen: '#98A78F',   // Sage / Muted Moss Green (from UI frame)
      canvas: '#F4F5F0',   // Light earthy canvas
      card: '#FFFFFF',     // Clean White Card
      surface: '#F8F9FA',  // Soft input/section grey
      muted: '#E9EBE5',    // Subtle borders
    },
    accent: {
      DEFAULT: '#C86D51',  // Terracotta accent
      green: '#38A169',    // Stock available
    },
    text: {
      primary: '#1A202C',  // Dark title text
      secondary: '#718096',// Subtext & crossed-out MRP
      muted: '#A0AEC0',
      white: '#FFFFFF',
    },
    badge: {
      discount: '#E53E3E',
      reward: '#D69E2E',
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1.25rem',
    xl: '1.75rem',
    full: '9999px',
  },
};