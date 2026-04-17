/**
 * Junko Bodie Roulette Tournament — Game State Hook
 *
 * Central state management for the roulette game.
 * Tracks balance, bets, spin results, history, and game phase.
 */

'use client';

import { useState, useCallback } from 'react';
import { type SpinResult, spinWheel, recordSpinResult, type WheelType } from '@/lib/rng';
import { type GamePhase } from '@/lib/gamePhases';
import { type PlacedBet, BET_MAP } from '@/lib/bets';
import { calculatePayouts, type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';
import { useGame } from '@/context/GameContext';

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
  const { balance, setBalance } = useGame();
  const [bets, setBets] = useState<Map<string, PlacedBet>>(new Map());
  const [selectedChip, setSelectedChip] = useState(5);
  const [wheelType, setWheelType] = useState<WheelType>('european');
  const [phase, setPhase] = useState<GamePhase>('BETTING');
  const [currentResult, setCurrentResult] = useState<SpinResult | null>(null);
  const [lastPayout, setLastPayout] = useState<PayoutResult | null>(null);
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [lastSpinBets, setLastSpinBets] = useState<Map<string, PlacedBet>>(new Map());
  const [betPlacementHistory, setBetPlacementHistory] = useState<{ betId: string; amount: number }[]>([]);
  const [sessionStats, setSessionStats] = useState({
    lastBet: 0,
    lastWin: 0,
    sessionWin: 0
  });
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteModeTarget, setDeleteModeTarget] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);

  /**
   * Helper to trigger a temporary funds error
   */
  const triggerFundError = useCallback((message: string = 'Insufficient funds for this bet') => {
    setFundError(message);
    soundEngine?.playDeniedSound();
  }, []);

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

      if (balance - totalBet < selectedChip) {
        triggerFundError();
        return;
      }

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

      // Track history for "Clear Last Bet"
      setBetPlacementHistory((prev) => [...prev, { betId, amount: selectedChip }]);
    },
    [phase, balance, totalBet, selectedChip]
  );

  /**
   * Remove last chip from a bet zone (manual right-click).
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

      // Simple removal doesn't update betPlacementHistory easily as it might not be the last placed
    },
    [phase]
  );

  /**
   * Clear only the most recently placed chip (Backtrack).
   */
  const clearLastBet = useCallback(() => {
    if (phase !== 'BETTING' || betPlacementHistory.length === 0) return;

    setBetPlacementHistory((prev) => {
      const nextHistory = [...prev];
      const lastAction = nextHistory.pop();
      if (!lastAction) return prev;

      setBets((currentBets) => {
        const nextBets = new Map(currentBets);
        const existing = nextBets.get(lastAction.betId);
        if (!existing) return currentBets;

        const chips = [...existing.chips];
        // Find and remove the matching chip (usually at the end)
        const lastChipIndex = chips.lastIndexOf(lastAction.amount);
        if (lastChipIndex === -1) return currentBets;

        chips.splice(lastChipIndex, 1);
        const newAmount = existing.amount - lastAction.amount;

        if (chips.length === 0) {
          nextBets.delete(lastAction.betId);
        } else {
          nextBets.set(lastAction.betId, { ...existing, amount: newAmount, chips });
        }
        return nextBets;
      });

      return nextHistory;
    });
  }, [phase, betPlacementHistory]);

  /**
   * Clear all bets.
   */
  const clearBets = useCallback(() => {
    if (phase !== 'BETTING') return;
    setBets(new Map());
    setBetPlacementHistory([]);
    setDeleteMode(false);
  }, [phase]);

  /**
   * Double all bets by multiplying each bet's value by 2.
   * Returns false if insufficient funds (toast will be shown by caller).
   */
  const doubleAllBets = useCallback(() => {
    if (phase !== 'BETTING' || bets.size === 0) return true; // Already valid state

    const totalBet = Array.from(bets.values()).reduce((sum, b) => sum + b.amount, 0);
    const newTotalBet = totalBet * 2;

    // Check if user has enough balance
    if (balance < newTotalBet) {
      triggerFundError();
      return false; // Insufficient funds
    }

    // Double all bets
    setBets((prev) => {
      const next = new Map<string, PlacedBet>();
      prev.forEach((bet, betId) => {
        next.set(betId, {
          ...bet,
          amount: bet.amount * 2,
          chips: bet.chips.map((c) => c * 2),
        });
      });
      return next;
    });

    // Also double the amounts in bet placement history so clearLastBet stays in sync
    setBetPlacementHistory((prev) =>
      prev.map((entry) => ({ ...entry, amount: entry.amount * 2 }))
    );

    // Play 2X sound
    soundEngine?.play2XClick();

    return true;
  }, [phase, bets, balance]);

  /**
   * Toggle delete mode. When enabled, clicking a bet zone removes chips.
   */
  const toggleDeleteMode = useCallback(() => {
    setDeleteMode((prev) => !prev);
    setDeleteModeTarget(null);
  }, []);

  /**
   * Pop the last (highest value) chip from a bet zone.
   */
  const popLastChip = useCallback(
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

      // Play swoosh sound for single chip removal
      soundEngine?.playSwoosh();
    },
    [phase]
  );

  /**
   * Clear all chips from a specific bet zone.
   */
  const clearZone = useCallback(
    (betId: string) => {
      if (phase !== 'BETTING') return;

      setBets((prev) => {
        const next = new Map(prev);
        next.delete(betId);
        return next;
      });

      // Play swoosh sound for zone clear
      soundEngine?.playSwoosh();
    },
    [phase]
  );

  /**
   * Re-apply the bets from the previous spin.
   */
  const rebet = useCallback(() => {
    if (phase !== 'BETTING' || lastSpinBets.size === 0) return;

    // Check if we have enough balance
    const lastTotal = Array.from(lastSpinBets.values()).reduce((sum, b) => sum + b.amount, 0);
    if (balance < lastTotal) {
      triggerFundError('Insufficient funds to re-bet');
      return;
    }

    setBets(cloneBetsMap(lastSpinBets));

    // Reconstruct history roughly for clearLast
    const history: { betId: string; amount: number }[] = [];
    lastSpinBets.forEach((bet, id) => {
      bet.chips.forEach(c => history.push({ betId: id, amount: c }));
    });
    setBetPlacementHistory(history);
  }, [phase, lastSpinBets, balance]);

  /**
   * Execute a spin. Returns the result for animation purposes.
   */
  const executeSpin = useCallback(async (): Promise<SpinResult | null> => {
    // Archive current bets for Rebet
    setLastSpinBets(cloneBetsMap(bets));

    // Deduct total bet from balance
    setBalance((prev: number) => prev - totalBet);
    setPhase('SPINNING');
    setDeleteMode(false);

    const result = await spinWheel(wheelType);
    setCurrentResult(result);

    return result;
  }, [totalBet, wheelType, bets]);

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
    setBalance((prev: number) => prev + payout.totalReturned);

    // Update session stats
    const spinBetTotal = betArray.reduce((sum, b) => sum + b.amount, 0);
    const winAmount = payout.totalReturned - spinBetTotal;

    // Play sounds
    if (winAmount > 0) {
      soundEngine?.playWinSound();
    } else if (spinBetTotal > 0) {
      soundEngine?.playLossSound();
    }

    setSessionStats(prev => ({
      lastBet: spinBetTotal,
      lastWin: winAmount,
      sessionWin: prev.sessionWin + winAmount
    }));

    // Add to history (newest first, keep last 25)
    setHistory((prev) => [currentResult, ...prev].slice(0, 25));
  }, [currentResult, bets]);

  /**
   * Move back to betting phase after result display.
   */
  const startNewRound = useCallback(() => {
    setPhase('BETTING');
    setBets(new Map());
    setBetPlacementHistory([]);
    setCurrentResult(null);
    setLastPayout(null);
    setDeleteMode(false);
  }, []);

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
    hasLastSpin: lastSpinBets.size > 0,
    deleteMode,
    deleteModeTarget,
    fundError,

    // Actions
    placeBet,
    removeBet,
    clearLastBet,
    clearBets,
    doubleAllBets,
    toggleDeleteMode,
    popLastChip,
    clearZone,
    rebet,
    setSelectedChip,
    setWheelType,
    setDeleteModeTarget,
    setFundError, // Expose to allow manual clearing
    executeSpin,
    resolveResult,
    startNewRound,
    setPhase,
  };
}
