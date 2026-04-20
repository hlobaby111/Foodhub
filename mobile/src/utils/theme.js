// Theme configuration matching web app's Tailwind colors EXACTLY
export const theme = {
  colors: {
    // Primary colors from web (--primary: 11 75% 55%)
    primary: '#E05D36',
    primaryForeground: '#FFFFFF',
    primaryDark: '#C54D2A',

    // Backgrounds
    background: '#FCFCF9', // --background: 39 10% 99%
    surface: '#FFFFFF',

    // Text colors
    text: '#1A1A1A', // --foreground: 0 0% 10%
    textSecondary: '#737373', // --muted-foreground: 0 0% 45%

    // Border & Input
    border: '#E8E6E0', // --border: 30 15% 91%
    input: '#E8E6E0',

    // Muted
    muted: '#F1EFE9', // --muted: 30 14% 94%
    mutedForeground: '#737373',

    // Success & Status
    success: '#6B8F59', // --success: 76 18% 47%
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Green shades for ratings
    green: {
      50: '#F0FDF4',
      600: '#16A34A',
      700: '#15803D',
    },

    // Red shades
    red: {
      500: '#EF4444',
    },

    // Orange accent
    orange: {
      100: '#FED7AA',
      800: '#C54D2A',
    },

    // Additional UI colors
    blue: {
      100: '#DBEAFE',
      800: '#1E40AF',
    },
    yellow: {
      100: '#FEF3C7',
      800: '#92400E',
    },
    indigo: {
      100: '#E0E7FF',
      800: '#3730A3',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 11,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxxl: 32,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fonts: {
    heading: 'Outfit', // Match web's font-heading
    body: 'DMSans', // Match web's font-body
  },
};
