// Powered by OnSpace.AI
// VoiceDub Pro – Premium Cinematic Theme

export const Colors = {
  // Base palette
  background:     '#080808',
  surface:        '#111111',
  surfaceElevated:'#1A1A1A',
  surfaceCard:    '#161616',
  border:         '#2A2A2A',
  borderSubtle:   '#1E1E1E',

  // Brand gold
  primary:        '#D4A017',
  primaryLight:   '#F0C040',
  primaryDark:    '#A07810',
  primaryGlow:    'rgba(212,160,23,0.18)',

  // Text
  textPrimary:    '#F5F5F5',
  textSecondary:  '#A0A0A0',
  textMuted:      '#555555',
  textInverse:    '#080808',

  // Semantic
  success:        '#2ECC71',
  error:          '#E74C3C',
  warning:        '#F39C12',
  info:           '#3498DB',

  // Recording states
  recording:      '#E74C3C',
  recordingGlow:  'rgba(231,76,60,0.25)',
  playing:        '#2ECC71',
  playingGlow:    'rgba(46,204,113,0.20)',

  // Gradient stops
  gradientGold:   ['#D4A017', '#F0C040', '#A07810'] as const,
  gradientDark:   ['#080808', '#111111'] as const,
  gradientCard:   ['#1A1A1A', '#111111'] as const,

  // Overlay
  overlay:        'rgba(0,0,0,0.7)',
  overlayLight:   'rgba(0,0,0,0.4)',
};

export const Typography = {
  // Font sizes
  xs:   11,
  sm:   13,
  base: 16,
  md:   18,
  lg:   20,
  xl:   24,
  xxl:  30,
  hero: 38,

  // Line heights
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,

  // Weights
  regular:    '400' as const,
  medium:     '500' as const,
  semibold:   '600' as const,
  bold:       '700' as const,
  black:      '900' as const,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  full: '100%' as const,
};

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  gold: {
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
