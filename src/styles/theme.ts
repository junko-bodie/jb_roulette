/**
 * Junko Bodie Roulette Tournament — Brand Design Tokens
 * 
 * All visual constants are locked here. Every component
 * must reference these tokens — never use raw color values.
 */

export const COLORS = {
  /** Primary background */
  black: '#0a0a0a',
  /** Rich gold accent */
  gold: '#c9a84c',
  /** Gold hover / lighter */
  goldLight: '#d4b85c',
  /** Gold pressed / darker */
  goldDark: '#b8973e',
  /** Deep green for structural elements */
  deepGreen: '#1a3a2a',
  /** Felt green for table surface */
  feltGreen: '#1e4d2b',
  /** Felt green lighter (for gradients) */
  feltGreenLight: '#256b3a',
  /** Felt green darker (for depth) */
  feltGreenDark: '#163d22',

  /** Roulette red */
  rouletteRed: '#c0392b',
  /** Roulette black */
  rouletteBlack: '#1a1a1a',
  /** Roulette green (0 / 00) */
  rouletteGreen: '#267b4bff',

  /** Chip denominations */
  chipWhite: '#f5f5f5',
  chipOrange: '#e67e22', // Orange $2
  chipBlue: '#2b52a2', // Royal Blue $10
  chipRed: '#c0392b',
  chipGreen: '#27ae60',
  chipBlack: '#1a1a1a',
  chipPurple: '#8e44ad',
  chipYellow: '#f1c40f', // Yellow $1000

  /** UI colors */
  textPrimary: '#f5f5f5',
  textSecondary: '#a0a0a0',
  textGold: '#c9a84c',
  surface: '#111111',
  surfaceLight: '#1a1a1a',
  border: '#2a2a2a',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export const FONTS = {
  /** Headline / display font — premium serif */
  primary: '"Bodoni Moda", "Playfair Display", serif',
  /** Body / UI font — clean sans-serif */
  secondary: '"Inter", "Helvetica Neue", sans-serif',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  gold: '0 0 20px rgba(201, 168, 76, 0.3)',
  goldStrong: '0 0 30px rgba(201, 168, 76, 0.5)',
} as const;

/** Chip denomination config — ordered by value */
export const CHIP_DENOMINATIONS = [
  { value: 1, label: '$1', color: COLORS.chipWhite, textColor: COLORS.black },
  { value: 2, label: '$2', color: COLORS.chipOrange, textColor: COLORS.textPrimary },
  { value: 5, label: '$5', color: COLORS.chipRed, textColor: COLORS.textPrimary },
  { value: 10, label: '$10', color: COLORS.chipBlue, textColor: COLORS.textPrimary },
  { value: 25, label: '$25', color: COLORS.chipGreen, textColor: COLORS.textPrimary },
  { value: 100, label: '$100', color: COLORS.chipBlack, textColor: COLORS.gold },
  { value: 500, label: '$500', color: COLORS.chipPurple, textColor: COLORS.textPrimary },
  { value: 1000, label: '$1000', color: COLORS.chipYellow, textColor: COLORS.black },
] as const;

/** Animation durations (ms) */
export const TIMING = {
  chipPlace: 300,
  chipRemove: 250,
  spinDuration: 6000,
  resultDisplay: 3000,
  hoverTransition: 150,
} as const;
