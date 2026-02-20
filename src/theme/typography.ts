// =============================================================================
// PadelSpot – Typography system
// Montserrat: main UI | Oswald: headlines, branding, prices
// =============================================================================

export const typography = {
  headline: {
    fontFamily: 'Oswald-Bold',
    fontSize: 28,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  subtitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
  },
  body: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  button: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
  },
  price: {
    fontFamily: 'Oswald-Medium',
    fontSize: 18,
  },
  caption: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  overline: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
  },
} as const;

export type TypographyKey = keyof typeof typography;
