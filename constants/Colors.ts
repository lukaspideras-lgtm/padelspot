// PadelSpot branding: bela tekst, gradijent pozadina, tamno siva surface
const TEXT_WHITE = '#FFFFFF';
const SURFACE = '#1F232A';
const ACCENT_GREEN = '#22c55e';
const ACCENT_BLUE = '#3b82f6';
const ACCENT_ORANGE = '#f97316';

export default {
  text: TEXT_WHITE,
  textSecondary: 'rgba(255,255,255,0.75)',
  background: 'transparent', // koristi LinearGradient
  surface: SURFACE,
  tint: ACCENT_GREEN,
  error: '#ef4444',
  success: ACCENT_GREEN,
  border: 'rgba(255,255,255,0.2)',
  // Gradient boje (light blue -> tamnija plava)
  gradientStart: '#7dd3fc',
  gradientEnd: '#0c4a6e',
  // Accent za terene (badge)
  courtGreen: ACCENT_GREEN,
  courtBlue: ACCENT_BLUE,
  courtOrange: ACCENT_ORANGE,
};
