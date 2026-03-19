// Al-Sharq Driver — Clean White Professional Theme
// Metaphor: Paper — matte surfaces with clean depth

export const theme = {
  // Primary Palette — Dark Blue
  primary: '#1A3B6D',
  primaryLight: '#2E5EA8',
  primaryDark: '#0F2443',
  primaryGlow: '#2563EB',

  // Accent — Orange
  accent: '#F57C20',
  accentLight: '#FDBA74',
  accentDark: '#C05E10',

  // Surfaces
  background: '#F5F6FA',
  backgroundSecondary: '#EBEEF5',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F2F8',
  surfaceGlass: 'rgba(26, 59, 109, 0.06)',

  // Text
  textPrimary: '#1A1D26',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E2E5EE',
  borderLight: '#EEF0F6',
  borderAccent: 'rgba(245, 124, 32, 0.25)',

  // Status
  success: '#16A34A',
  successLight: 'rgba(22, 163, 74, 0.10)',
  error: '#DC2626',
  errorLight: 'rgba(220, 38, 38, 0.10)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.10)',
  info: '#2563EB',
  infoLight: 'rgba(37, 99, 235, 0.10)',

  // Trip Status Colors
  statusAvailable: '#2563EB',
  statusAccepted: '#F59E0B',
  statusInProgress: '#7C3AED',
  statusCompleted: '#16A34A',
  statusCancelled: '#DC2626',
  statusConfirmed: '#0D9488',

  // Radius
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 24,
  radiusFull: 100,

  // Shadows (iOS)
  shadow: {
    shadowColor: '#1A3B6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  shadowLight: {
    shadowColor: '#1A3B6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
};

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, color: theme.textPrimary, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const, color: theme.textPrimary },
  subtitle: { fontSize: 18, fontWeight: '600' as const, color: theme.textPrimary },
  sectionHeader: { fontSize: 16, fontWeight: '700' as const, color: theme.textPrimary },
  cardTitle: { fontSize: 15, fontWeight: '600' as const, color: theme.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: theme.textSecondary },
  bodyBold: { fontSize: 14, fontWeight: '600' as const, color: theme.textPrimary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: theme.textMuted },
  captionBold: { fontSize: 12, fontWeight: '700' as const, color: theme.textMuted },
  price: { fontSize: 20, fontWeight: '700' as const, color: theme.accent },
  badge: { fontSize: 10, fontWeight: '700' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
