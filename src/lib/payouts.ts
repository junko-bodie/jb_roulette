/**
 * Junko Bodie Roulette Tournament — Payout Calculator
 *
 * Calculates winnings for all placed bets given a spin result.
 * Returns per-bet outcomes and aggregate totals.
 */

import { type SpinResult } from './rng';
import { type PlacedBet, BET_MAP } from './bets';

export interface BetOutcome {
  /** The bet zone ID */
  betId: string;
  /** Amount wagered */
  wagered: number;
  /** Amount won (0 if lost) — does NOT include original stake */
  won: number;
  /** Whether this bet won */
  isWin: boolean;
}

export interface PayoutResult {
  /** Per-bet outcomes */
  outcomes: BetOutcome[];
  /** Total amount wagered across all bets */
  totalWagered: number;
  /** Total amount won (profit, not including returned stakes) */
  totalWon: number;
  /** Net result: positive = player profit, negative = player loss */
  netResult: number;
  /** Total returned to player (stakes on winning bets + winnings) */
  totalReturned: number;
}

/**
 * Check if a placed bet wins given the spin result.
 *
 * A bet wins if the spin result number is in the bet's covered numbers.
 */
function doesBetWin(betId: string, spinResult: SpinResult): boolean {
  const definition = BET_MAP.get(betId);
  if (!definition) return false;

  return definition.numbers.includes(spinResult.number);
}

/**
 * Calculate full payout results for all placed bets.
 *
 * @param bets - All bets the player has placed
 * @param spinResult - The result from the RNG
 * @returns Complete payout breakdown
 */
export function calculatePayouts(
  bets: PlacedBet[],
  spinResult: SpinResult
): PayoutResult {
  const outcomes: BetOutcome[] = [];
  let totalWagered = 0;
  let totalWon = 0;
  let totalReturned = 0;

  for (const bet of bets) {
    const definition = BET_MAP.get(bet.betId);
    if (!definition) continue;

    const isWin = doesBetWin(bet.betId, spinResult);
    const won = isWin ? bet.amount * definition.payout : 0;
    const returned = isWin ? bet.amount + won : 0;

    outcomes.push({
      betId: bet.betId,
      wagered: bet.amount,
      won,
      isWin,
    });

    totalWagered += bet.amount;
    totalWon += won;
    totalReturned += returned;
  }

  return {
    outcomes,
    totalWagered,
    totalWon,
    netResult: totalReturned - totalWagered,
    totalReturned,
  };
}
