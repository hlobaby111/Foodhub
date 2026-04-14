// Theme configuration matching web app's Tailwind colors
export const theme = {
  colors: {
    primary: '#E05D36', // Orange from web
    primaryDark: '#C54D2A',
    secondary: '#1A1A1A',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#737373',
    border: '#E5E5E5',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    green: {
      50: '#F0FDF4',
      600: '#16A34A',
      700: '#15803D',
    },
    red: {
      500: '#EF4444',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
