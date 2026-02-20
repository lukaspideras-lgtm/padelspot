// =============================================================================
// PadelSpot – Theme color tokens
// No hardcoded colors in components – use useTheme() or theme tokens
// =============================================================================

export type ThemeMode = 'dark' | 'light';

export const DARK_THEME = {
  background: '#0F1720',
  surface: '#1F2933',
  surfaceMuted: 'rgba(255,255,255,0.08)',
  cardSelected: 'rgba(255,255,255,0.25)',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  tint: '#22c55e',
  error: '#ef4444',
  success: '#22c55e',
  border: '#374151',
  gradientStart: '#1e3a5f',
  gradientEnd: '#0F1720',
  courtGreen: '#22c55e',
  courtBlue: '#3b82f6',
  courtOrange: '#f97316',
} as const;

export const LIGHT_THEME = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: 'rgba(0,0,0,0.05)',
  cardSelected: 'rgba(0,0,0,0.08)',
  text: '#111827',
  textSecondary: '#6B7280',
  tint: '#16a34a',
  error: '#dc2626',
  success: '#16a34a',
  border: '#e5e7eb',
  gradientStart: '#7dd3fc',
  gradientEnd: '#0c4a6e',
  courtGreen: '#22c55e',
  courtBlue: '#3b82f6',
  courtOrange: '#f97316',
} as const;

export type Theme = typeof DARK_THEME;

export const themes: Record<ThemeMode, Theme> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};
