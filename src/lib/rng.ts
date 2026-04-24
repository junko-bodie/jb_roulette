export type WheelType = 'american' | 'european';

export interface SpinResult {
  id: string;
  number: number;
  /** Display label — e.g. "00" for double-zero, "17" for normal */
  displayNumber: string;
  color: 'red' | 'black' | 'green';
  parity: 'odd' | 'even' | 'none';
  dozen: '1st' | '2nd' | '3rd' | 'none';
  column: '1st' | '2nd' | '3rd' | 'none';
  half: '1-18' | '19-36' | 'none';
}

/** Red numbers on a standard roulette wheel */
const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

/**
 * American wheel pocket order (clockwise).
 * 37 = 00 (internal representation)
 */
export const AMERICAN_WHEEL_ORDER = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36,
  13, 1, 37, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16,
  4, 23, 35, 14, 2,
];

/** European wheel pocket order (clockwise) */
export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
  11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26,
];

/**
 * Get the color for a given roulette number.
 * 0 and 00 (37) are green. Others are red or black.
 */
export function getNumberColor(num: number): 'red' | 'black' | 'green' {
  if (num === 0 || num === 37) return 'green';
  return RED_NUMBERS.has(num) ? 'red' : 'black';
}

/**
 * Get the display string for a number (handles 00).
 */
export function getDisplayNumber(num: number): string {
  if (num === 37) return '00';
  return num.toString();
}

/**
 * Determine which dozen a number belongs to.
 */
function getDozen(num: number): '1st' | '2nd' | '3rd' | 'none' {
  if (num === 0 || num === 37) return 'none';
  if (num <= 12) return '1st';
  if (num <= 24) return '2nd';
  return '3rd';
}

/**
 * Determine which column a number belongs to.
 * Column 1: 1,4,7,10,13,16,19,22,25,28,31,34
 * Column 2: 2,5,8,11,14,17,20,23,26,29,32,35
 * Column 3: 3,6,9,12,15,18,21,24,27,30,33,36
 */
function getColumn(num: number): '1st' | '2nd' | '3rd' | 'none' {
  if (num === 0 || num === 37) return 'none';
  const mod = num % 3;
  if (mod === 1) return '1st';
  if (mod === 2) return '2nd';
  return '3rd'; // mod === 0
}

/**
 * Determine which half a number belongs to.
 */
function getHalf(num: number): '1-18' | '19-36' | 'none' {
  if (num === 0 || num === 37) return 'none';
  return num <= 18 ? '1-18' : '19-36';
}

/**
 * Determine parity.
 */
function getParity(num: number): 'odd' | 'even' | 'none' {
  if (num === 0 || num === 37) return 'none';
  return num % 2 === 0 ? 'even' : 'odd';
}

/**
 * Generate a spin result using client-side cryptographic RNG.
 */
export async function spinWheel(wheelType: WheelType = 'american'): Promise<SpinResult> {
  const pockets = wheelType === 'american' ? AMERICAN_WHEEL_ORDER : EUROPEAN_WHEEL_ORDER;
  const totalPockets = pockets.length;

  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  const index = randomBytes[0] % totalPockets;
  const number = pockets[index];

  return {
    id: Math.random().toString(36).substring(2, 11),
    number,
    displayNumber: getDisplayNumber(number),
    color: getNumberColor(number),
    parity: getParity(number),
    dozen: getDozen(number),
    column: getColumn(number),
    half: getHalf(number),
  };
}

/**
 * Log a spin result to the database.
 * Placeholder for future implementation.
 */
export async function recordSpinResult(result: SpinResult, wheelType: WheelType) {
  // TODO: Implement logging to Postgres
}


export function getWheelIndex(number: number, wheelType: WheelType = 'american'): number {
  const order = wheelType === 'american' ? AMERICAN_WHEEL_ORDER : EUROPEAN_WHEEL_ORDER;
  return order.indexOf(number);
}
