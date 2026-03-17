// Al-Sharq Transport — Royal Blue Professional Theme
// Metaphor: Glass — smooth surfaces with layered depth

export const theme = {
  // Primary Palette — Royal Blue
  primary: '#1E3A8A',
  primaryLight: '#3B5FCC',
  primaryDark: '#0F1D45',
  primaryGlow: '#2563EB',

  // Accent — Gold
  accent: '#D4A017',
  accentLight: '#F5D060',
  accentDark: '#8B6914',

  // Surfaces
  background: '#040B1A',
  backgroundSecondary: '#0A1628',
  surface: '#0D1B33',
  surfaceElevated: '#132444',
  surfaceGlass: 'rgba(30, 58, 138, 0.12)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#040B1A',

  // Borders
  border: '#1E3152',
  borderLight: '#162845',
  borderAccent: 'rgba(212, 160, 23, 0.3)',

  // Status
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // Trip Status Colors
  statusAvailable: '#3B82F6',
  statusAccepted: '#F59E0B',
  statusInProgress: '#8B5CF6',
  statusCompleted: '#22C55E',
  statusCancelled: '#EF4444',
  statusConfirmed: '#14B8A6',

  // Radius
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 24,
  radiusFull: 100,

  // Shadows (iOS)
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shadowLight: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
