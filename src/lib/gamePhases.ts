/**
 * Game Phases Definition
 *
 * Defines the strict sequential phases the roulette game cycles through.
 * Every UI element responds to the current phase to determine interactivity
 * and visual state.
 */

export type GamePhase =
  | 'BETTING'   // Players can place and remove chips
  | 'LOCKED'    // Betting closed, spin is about to begin
  | 'SPINNING'  // Wheel is in motion, no interaction allowed
  | 'RESULT'    // Result is displayed, win/loss calculated
  | 'RESET';    // Table clears, next round begins
