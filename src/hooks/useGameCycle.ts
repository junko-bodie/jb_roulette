/**
 * useGameCycle — Centralized phase transition orchestrator
 *
 * Manages the timeouts and automated flow of the game:
 * BETTING (45s) -> LOCKED (1.5s) -> SPINNING (5-7s, resolved externally)
 *   -> RESULT (3s) -> RESET (1.5s) -> BETTING...
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { type GamePhase } from '@/lib/gamePhases';

export const BETTING_DURATION = 45;
const LOCKED_DURATION_MS = 1500;
const RESULT_DURATION_MS = 3000;
const RESET_DURATION_MS = 1500;

interface UseGameCycleArgs {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  executeSpin: () => void;
  startNewRound: () => void;
}

export function useGameCycle({ phase, setPhase, executeSpin, startNewRound }: UseGameCycleArgs) {
  const [timeRemaining, setTimeRemaining] = useState(BETTING_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest callbacks in refs to avoid restarting the timer effect on every bet
  const executeSpinRef = useRef(executeSpin);
  const startNewRoundRef = useRef(startNewRound);

  useEffect(() => {
    executeSpinRef.current = executeSpin;
    startNewRoundRef.current = startNewRound;
  }, [executeSpin, startNewRound]);

  // Phase effect runner
  useEffect(() => {
    // Clear any existing active timeouts when phase changes
    if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);

    switch (phase) {
      case 'BETTING':
        setTimeRemaining(BETTING_DURATION);
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              setPhase('LOCKED');
              return 0; // lock at 0
            }
            return prev - 1;
          });
        }, 1000);
        break;

      case 'LOCKED':
        // Bets closed overlay shows. We now wait indefinitely for the user
        // to manually click the SpinButton.
        break;

      case 'SPINNING':
        // Resolved externally via the wheel's onSpinComplete callback
        break;

      case 'RESULT':
        // Show the winning chips temporarily, then automatically move to reset
        timerRef.current = setTimeout(() => {
          setPhase('RESET');
        }, RESULT_DURATION_MS);
        break;

      case 'RESET':
        // Clear table visually with animation, then go back to betting
        timerRef.current = setTimeout(() => {
          startNewRoundRef.current(); // sets phase to BETTING, clears chips
        }, RESET_DURATION_MS);
        break;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as NodeJS.Timeout);
        clearTimeout(timerRef.current as NodeJS.Timeout);
      }
    };
  }, [phase, setPhase]);

  // Expose manual cycle triggers for external control
  const startCycle = useCallback(() => {
    if (phase === 'BETTING') {
      setPhase('LOCKED');
    }
  }, [phase, setPhase]);

  const resetCycle = useCallback(() => {
    startNewRound();
  }, [startNewRound]);

  return {
    currentPhase: phase,
    timeRemaining,
    startCycle,
    resetCycle,
  };
}
