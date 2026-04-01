/**
 * Junko Bodie Roulette Tournament — Game State Hook
 *
 * Central state management for the roulette game.
 * Tracks balance, bets, spin results, history, and game phase.
 */

'use client';

import { useState, useCallback } from 'react';
import { type SpinResult, spinWheel, type WheelType } from '@/lib/rng';
import { type PlacedBet, BET_MAP } from '@/lib/bets';
import { calculatePayouts, type PayoutResult } from '@/lib/payouts';

import { type GamePhase } from '@/lib/gamePhases';

const STARTING_BALANCE = 1000;

export interface GameState {
  balance: number;
  bets: Map<string, PlacedBet>;
  selectedChip: number;
  wheelType: WheelType;
  phase: GamePhase;
  currentResult: SpinResult | null;
  lastPayout: PayoutResult | null;
  history: SpinResult[];
  totalBet: number;
}

export interface SessionStats {
  spins: number;
  wins: number;
  losses: number;
  lastWin: number;
  lastBets: number;
  netLastWin: number;
  sessionWin: number;
  hitPercent: number;
  missPercent: number;
}

function cloneBetsMap(source: Map<string, PlacedBet>): Map<string, PlacedBet> {
  return new Map(Array.from(source.entries()).map(([betId, bet]) => [
    betId,
    {
      ...bet,
      chips: [...bet.chips],
    },
  ]));
}

export function useGameState() {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [bets, setBets] = useState<Map<string, PlacedBet>>(new Map());
  const [selectedChip, setSelectedChip] = useState(5);
  const [wheelType, setWheelType] = useState<WheelType>('american');
  const [phase, setPhase] = useState<GamePhase>('BETTING');
  const [currentResult, setCurrentResult] = useState<SpinResult | null>(null);
  const [lastPayout, setLastPayout] = useState<PayoutResult | null>(null);
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [lastRoundBets, setLastRoundBets] = useState<Map<string, PlacedBet>>(new Map());
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    spins: 0,
    wins: 0,
    losses: 0,
    lastWin: 0,
    lastBets: 0,
    netLastWin: 0,
    sessionWin: 0,
    hitPercent: 0,
    missPercent: 0,
  });

  // Calculate total bet
  const totalBet = Array.from(bets.values()).reduce((sum, b) => sum + b.amount, 0);

  /**
   * Place a chip on a bet zone.
   */
  const placeBet = useCallback(
    (betId: string) => {
      if (phase !== 'BETTING') return;

      const definition = BET_MAP.get(betId);
      if (!definition) return;

      if (balance - totalBet < selectedChip) return; // Insufficient funds

      setBets((prev) => {
        const next = new Map(prev);
        const existing = next.get(betId);
        if (existing) {
          next.set(betId, {
            ...existing,
            amount: existing.amount + selectedChip,
            chips: [...existing.chips, selectedChip],
          });
        } else {
          next.set(betId, {
            betId,
            amount: selectedChip,
            chips: [selectedChip],
          });
        }
        return next;
      });
    },
    [phase, balance, totalBet, selectedChip]
  );

  /**
   * Remove last chip from a bet zone.
   */
  const removeBet = useCallback(
    (betId: string) => {
      if (phase !== 'BETTING') return;

      setBets((prev) => {
        const next = new Map(prev);
        const existing = next.get(betId);
        if (!existing || existing.chips.length === 0) return prev;

        const chips = [...existing.chips];
        const removedChip = chips.pop()!;
        const newAmount = existing.amount - removedChip;

        if (chips.length === 0) {
          next.delete(betId);
        } else {
          next.set(betId, { ...existing, amount: newAmount, chips });
        }
        return next;
      });
    },
    [phase]
  );

  /**
   * Clear all bets.
   */
  const clearBets = useCallback(() => {
    if (phase !== 'BETTING') return;
    setBets(new Map());
  }, [phase]);

  /**
   * Execute a spin. Returns the result for animation purposes.
   */
  const executeSpin = useCallback((): SpinResult | null => {
    if (phase !== 'BETTING' && phase !== 'LOCKED') return null;
    if (bets.size === 0) return null;

    // Snapshot current round bets for rebet before resetting.
    setLastRoundBets(cloneBetsMap(bets));

    // Deduct total bet from balance
    setBalance((prev) => prev - totalBet);
    setPhase('SPINNING');

    const result = spinWheel(wheelType);
    setCurrentResult(result);

    return result;
  }, [phase, bets, totalBet, wheelType]);

  /**
   * Called when spin animation completes. Resolves payouts.
   */
  const resolveResult = useCallback(() => {
    if (!currentResult) return;

    setPhase('RESULT');

    const betArray = Array.from(bets.values());
    const payout = calculatePayouts(betArray, currentResult);
    setLastPayout(payout);

    // Add winnings to balance (returned stakes + profit)
    setBalance((prev) => prev + payout.totalReturned);

    // Add to history (keep last 10)
    setHistory((prev) => [currentResult, ...prev].slice(0, 10));

    // Update session performance metrics.
    setSessionStats((prev) => {
      const spins = prev.spins + 1;
      const wins = prev.wins + (payout.netResult > 0 ? 1 : 0);
      const losses = prev.losses + (payout.netResult <= 0 ? 1 : 0);
      const hitPercent = spins > 0 ? (wins / spins) * 100 : 0;
      const missPercent = spins > 0 ? (losses / spins) * 100 : 0;

      return {
        spins,
        wins,
        losses,
        lastWin: payout.totalReturned,
        lastBets: payout.totalWagered,
        netLastWin: payout.netResult,
        sessionWin: prev.sessionWin + payout.netResult,
        hitPercent,
        missPercent,
      };
    });
  }, [currentResult, bets]);

  /**
   * Move back to betting phase after result display.
   */
  const startNewRound = useCallback(() => {
    setPhase('BETTING');
    setBets(new Map());
    setCurrentResult(null);
    setLastPayout(null);
  }, []);

  const rebetLastRound = useCallback(() => {
    if (phase !== 'BETTING' || lastRoundBets.size === 0) return;
    setBets(cloneBetsMap(lastRoundBets));
  }, [phase, lastRoundBets]);

  return {
    // State
    balance,
    bets,
    selectedChip,
    wheelType,
    phase,
    currentResult,
    lastPayout,
    history,
    totalBet,
    sessionStats,

    // Actions
    placeBet,
    removeBet,
    clearBets,
    setSelectedChip,
    setWheelType,
    executeSpin,
    resolveResult,
    startNewRound,
    rebetLastRound,
    setPhase,
  };
}
