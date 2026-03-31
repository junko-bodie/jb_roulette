/**
 * Junko Bodie Roulette Tournament — Bet Definitions & State
 *
 * Defines all bet types, their covered numbers, and placement utilities.
 * This is the single source of truth for the betting grid layout logic.
 */

export type BetType =
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'sixline'
  | 'dozen'
  | 'column'
  | 'red'
  | 'black'
  | 'odd'
  | 'even'
  | 'low'
  | 'high'
  | 'trio'
  | 'basket';

export interface BetDefinition {
  /** Unique identifier for this bet zone, e.g. "straight-17", "split-1-2" */
  id: string;
  /** Type of bet */
  type: BetType;
  /** Label displayed on the zone */
  label: string;
  /** Numbers this bet covers (37 = 00) */
  numbers: number[];
  /** Payout multiplier (e.g. 35 for straight up — means 35:1 = win 35 + original stake) */
  payout: number;
}

export interface PlacedBet {
  /** References a BetDefinition.id */
  betId: string;
  /** Total wagered on this zone */
  amount: number;
  /** Chip values placed (for visual stacking) */
  chips: number[];
}

// -------------------------------------------------------------------
// Payout multipliers
// -------------------------------------------------------------------

export const PAYOUT_MULTIPLIERS: Record<BetType, number> = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  sixline: 5,
  dozen: 2,
  column: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
  trio: 11,
  basket: 6,
};

// -------------------------------------------------------------------
// Generate all standard bet zones
// -------------------------------------------------------------------

/**
 * Build all straight-up bets (0, 00, 1-36).
 */
function buildStraightBets(): BetDefinition[] {
  const bets: BetDefinition[] = [
    { id: 'straight-0', type: 'straight', label: '0', numbers: [0], payout: 35 },
    { id: 'straight-00', type: 'straight', label: '00', numbers: [37], payout: 35 },
  ];
  for (let i = 1; i <= 36; i++) {
    bets.push({
      id: `straight-${i}`,
      type: 'straight',
      label: i.toString(),
      numbers: [i],
      payout: 35,
    });
  }
  return bets;
}

/**
 * Build all split bets (horizontal and vertical adjacent pairs).
 */
function buildSplitBets(): BetDefinition[] {
  const bets: BetDefinition[] = [];

  // Vertical splits (same column, consecutive rows)
  for (let i = 1; i <= 33; i++) {
    bets.push({
      id: `split-${i}-${i + 3}`,
      type: 'split',
      label: `${i}|${i + 3}`,
      numbers: [i, i + 3],
      payout: 17,
    });
  }

  // Horizontal splits (same row, adjacent columns)
  for (let row = 0; row < 12; row++) {
    const base = row * 3 + 1;
    // Col 1 & 2
    bets.push({
      id: `split-${base}-${base + 1}`,
      type: 'split',
      label: `${base}|${base + 1}`,
      numbers: [base, base + 1],
      payout: 17,
    });
    // Col 2 & 3
    bets.push({
      id: `split-${base + 1}-${base + 2}`,
      type: 'split',
      label: `${base + 1}|${base + 2}`,
      numbers: [base + 1, base + 2],
      payout: 17,
    });
  }

  // 0-00 split (American only)
  bets.push({
    id: 'split-0-00',
    type: 'split',
    label: '0|00',
    numbers: [0, 37],
    payout: 17,
  });

  return bets;
}

/**
 * Build all street bets (3 consecutive numbers in a row).
 */
function buildStreetBets(): BetDefinition[] {
  const bets: BetDefinition[] = [];
  for (let row = 0; row < 12; row++) {
    const base = row * 3 + 1;
    bets.push({
      id: `street-${base}-${base + 1}-${base + 2}`,
      type: 'street',
      label: `${base}-${base + 2}`,
      numbers: [base, base + 1, base + 2],
      payout: 11,
    });
  }
  return bets;
}

/**
 * Build all corner bets (4 numbers forming a square).
 */
function buildCornerBets(): BetDefinition[] {
  const bets: BetDefinition[] = [];
  for (let row = 0; row < 11; row++) {
    const base = row * 3 + 1;
    // Corner between col 1-2
    bets.push({
      id: `corner-${base}-${base + 1}-${base + 3}-${base + 4}`,
      type: 'corner',
      label: `${base},${base + 1},${base + 3},${base + 4}`,
      numbers: [base, base + 1, base + 3, base + 4],
      payout: 8,
    });
    // Corner between col 2-3
    bets.push({
      id: `corner-${base + 1}-${base + 2}-${base + 4}-${base + 5}`,
      type: 'corner',
      label: `${base + 1},${base + 2},${base + 4},${base + 5}`,
      numbers: [base + 1, base + 2, base + 4, base + 5],
      payout: 8,
    });
  }
  return bets;
}

/**
 * Build all six-line bets (6 numbers across 2 rows).
 */
function buildSixLineBets(): BetDefinition[] {
  const bets: BetDefinition[] = [];
  for (let row = 0; row < 11; row++) {
    const base = row * 3 + 1;
    bets.push({
      id: `sixline-${base}-${base + 5}`,
      type: 'sixline',
      label: `${base}-${base + 5}`,
      numbers: [base, base + 1, base + 2, base + 3, base + 4, base + 5],
      payout: 5,
    });
  }
  return bets;
}

/**
 * Build all trio bets (0-1-2, 0-2-3) and (00-2-3 for US).
 */
function buildTrioBets(): BetDefinition[] {
  return [
    { id: 'trio-0-1-2', type: 'trio', label: '0,1,2', numbers: [0, 1, 2], payout: 11 },
    { id: 'trio-0-2-3', type: 'trio', label: '0,2,3', numbers: [0, 2, 3], payout: 11 },
    { id: 'trio-00-2-3', type: 'trio', label: '00,2,3', numbers: [37, 2, 3], payout: 11 },
  ];
}

/**
 * Build basket/topline bets.
 * EU First Four: 0-1-2-3 (pays 8:1)
 * US Top Line: 0-00-1-2-3 (pays 6:1)
 */
function buildBasketBets(): BetDefinition[] {
  return [
    { id: 'basket-0-1-2-3', type: 'basket', label: '0-3', numbers: [0, 1, 2, 3], payout: 8 },
    { id: 'basket-0-00-1-2-3', type: 'basket', label: 'Top Line', numbers: [0, 37, 1, 2, 3], payout: 6 },
  ];
}

/**
 * All outside bet definitions.
 */
function buildOutsideBets(): BetDefinition[] {
  const col1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
  const col2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
  const col3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
  const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNums = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  return [
    // Dozens
    { id: 'dozen-1st', type: 'dozen', label: '1st 12', numbers: Array.from({ length: 12 }, (_, i) => i + 1), payout: 2 },
    { id: 'dozen-2nd', type: 'dozen', label: '2nd 12', numbers: Array.from({ length: 12 }, (_, i) => i + 13), payout: 2 },
    { id: 'dozen-3rd', type: 'dozen', label: '3rd 12', numbers: Array.from({ length: 12 }, (_, i) => i + 25), payout: 2 },

    // Columns
    { id: 'column-1st', type: 'column', label: '2 to 1', numbers: col1, payout: 2 },
    { id: 'column-2nd', type: 'column', label: '2 to 1', numbers: col2, payout: 2 },
    { id: 'column-3rd', type: 'column', label: '2 to 1', numbers: col3, payout: 2 },

    // Even-money bets
    { id: 'red', type: 'red', label: 'RED', numbers: redNums, payout: 1 },
    { id: 'black', type: 'black', label: 'BLACK', numbers: blackNums, payout: 1 },
    { id: 'odd', type: 'odd', label: 'ODD', numbers: Array.from({ length: 18 }, (_, i) => i * 2 + 1), payout: 1 },
    { id: 'even', type: 'even', label: 'EVEN', numbers: Array.from({ length: 18 }, (_, i) => (i + 1) * 2), payout: 1 },
    { id: 'low', type: 'low', label: '1-18', numbers: Array.from({ length: 18 }, (_, i) => i + 1), payout: 1 },
    { id: 'high', type: 'high', label: '19-36', numbers: Array.from({ length: 18 }, (_, i) => i + 19), payout: 1 },
  ];
}

/**
 * Complete list of all bet definitions for the main grid.
 * (Splits, corners, streets, sixlines are created but placed on
 * the grid boundaries — they won't each have a dedicated cell.)
 *
 * For the betting layout, we primarily render:
 * - Straight bets (the number cells)
 * - Outside bets (dozens, columns, even-money)
 *
 * Inside combination bets (split, street, corner, sixline) are
 * triggered by clicking on the grid boundaries between numbers.
 */
export const ALL_STRAIGHT_BETS = buildStraightBets();
export const ALL_SPLIT_BETS = buildSplitBets();
export const ALL_STREET_BETS = buildStreetBets();
export const ALL_CORNER_BETS = buildCornerBets();
export const ALL_SIXLINE_BETS = buildSixLineBets();
export const ALL_TRIO_BETS = buildTrioBets();
export const ALL_BASKET_BETS = buildBasketBets();
export const ALL_OUTSIDE_BETS = buildOutsideBets();

/** Flat lookup map: betId → BetDefinition */
export const BET_MAP: Map<string, BetDefinition> = new Map();
[
  ...ALL_STRAIGHT_BETS,
  ...ALL_SPLIT_BETS,
  ...ALL_STREET_BETS,
  ...ALL_CORNER_BETS,
  ...ALL_SIXLINE_BETS,
  ...ALL_TRIO_BETS,
  ...ALL_BASKET_BETS,
  ...ALL_OUTSIDE_BETS,
].forEach((b) => BET_MAP.set(b.id, b));

/**
 * Find all bet definitions that cover a given number.
 */
export function getBetsForNumber(num: number): BetDefinition[] {
  const result: BetDefinition[] = [];
  BET_MAP.forEach((bet) => {
    if (bet.numbers.includes(num)) {
      result.push(bet);
    }
  });
  return result;
}
