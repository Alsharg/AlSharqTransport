import { Platform } from 'react-native';

export const theme = {
  // Primary Colors
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#1E3A5F',

  // Accent / CTA
  accent: '#FBBF24',
  accentLight: '#FDE68A',
  accentDark: '#D97706',

  // Backgrounds (Dark Mode)
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceElevated: '#334155',

  // Text (Dark Mode)
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#0F172A',

  // Status
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A5F',

  // Borders
  border: '#334155',
  borderLight: '#1E293B',

  // Trip Status Colors
  statusAvailable: '#60A5FA',
  statusAccepted: '#FBBF24',
  statusInProgress: '#A78BFA',
  statusCompleted: '#34D399',
  statusCancelled: '#F87171',

  // Radius
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 20,
  radiusFull: 9999,

  // Shadows (subtle for dark mode)
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  }),
  shadowElevated: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
  }),
  shadowModal: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: { elevation: 10 },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
  }),
};

// Typography Scale (Dark Mode)
export const typography = {
  heroData: { fontSize: 48, fontWeight: '700' as const, color: theme.accent },
  heroLabel: { fontSize: 11, fontWeight: '600' as const, color: theme.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '700' as const, color: theme.textPrimary },
  subtitle: { fontSize: 18, fontWeight: '600' as const, color: theme.textPrimary },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: theme.textPrimary },
  cardValue: { fontSize: 24, fontWeight: '700' as const, color: theme.primary },
  body: { fontSize: 15, fontWeight: '400' as const, color: theme.textPrimary },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, color: theme.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: theme.textSecondary },
  captionBold: { fontSize: 13, fontWeight: '600' as const, color: theme.textSecondary },
  sectionHeader: { fontSize: 16, fontWeight: '700' as const, color: theme.textPrimary },
  smallLabel: { fontSize: 11, fontWeight: '600' as const, color: theme.textMuted },
  price: { fontSize: 18, fontWeight: '700' as const, color: theme.accent },
  bigPrice: { fontSize: 32, fontWeight: '700' as const, color: theme.accent },
};
