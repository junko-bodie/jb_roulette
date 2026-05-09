'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Tournament, TournamentPlayer } from '@/lib/models/Tournament';
import { PlacedBet } from '../bets';
import { calculatePayouts } from '../payouts';
import { useGame } from '@/context/GameContext';
import { soundEngine } from '../audioEngine';

export type TournamentPhase =
  | 'waiting'
  | 'betting'
  | 'locked'
  | 'spinning'
  | 'result'
  | 'elimination'
  | 'round_complete'
  | 'completed';

export interface BettingEvent {
  id: string;
  username: string;
  amount: number;
  betId: string;
  timestamp: number;
  color: string;
  betZone?: string;
}

interface TournamentContextType {
  tournament: Tournament | null;
  currentRound: number;
  currentSpin: number;
  totalSpins: number;
  phase: TournamentPhase;
  activePlayers: TournamentPlayer[];
  eliminatedPlayers: TournamentPlayer[];
  scores: Array<{
    player_id: any;
    username: string;
    chips: number;
    rank: number;
    is_bot: boolean;
    status: 'active' | 'eliminated';
    final_position?: number | null;
    color: string;
    currentWager: number;
    isEliminating?: boolean; // For animation
  }>;
  timeRemaining: number;
  setPhase: (phase: TournamentPhase) => void;
  submitBets: (bets: any) => void;
  completeSpin: () => void;
  lastSpinResult: any;
  lastPlayerPayout: any;
  allSpinBets: any[];
  botBets: any[];
  eliminatedPlayer: any;
  dismissResult: () => void;
  declareWinner: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lobbyTimeRemaining: number;
  syncMyBets: (bets: any[]) => Promise<void>;
  bets: Map<string, PlacedBet>;
  setBets: React.Dispatch<React.SetStateAction<Map<string, PlacedBet>>>;
  totalBet: number;
  history: any[];
  showResult: boolean;
  events: BettingEvent[];
  addEvent: (event: Omit<BettingEvent, 'id' | 'timestamp'>) => void;
  wheelType: 'american' | 'european';
  updateWheelType: (type: 'american' | 'european') => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Phase precedence — higher number wins when merging client/server state
const PHASE_PRIORITY: Record<string, number> = {
  waiting: 0,
  betting: 1,
  locked: 2,
  spinning: 3,
  result: 4,
  elimination: 5,
  completed: 6,
  round_complete: 3.5,
};

const PLAYER_COLORS = [
  '#2563EB', // Sapphire Blue
  '#059669', // Emerald Green
  '#991B1B', // Deep Crimson
  '#7C3AED', // Amethyst Purple
  '#0D9488', // Deep Teal
  '#475569', // Storm Slate
];

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const { userProfile } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<TournamentPhase>('waiting');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentSpin, setCurrentSpin] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [botBets, setBotBets] = useState<any[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [lastSpinResult, setLastSpinResult] = useState<any>(null);
  const [allSpinBets, setAllSpinBets] = useState<any[]>([]);
  const [lastPlayerPayout, setLastPlayerPayout] = useState<any>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<any>(null);
  const [lobbyTimeRemaining, setLobbyTimeRemaining] = useState<number>(30);
  const [currentRoundData, setCurrentRoundData] = useState<any>(null);
  const [bets, setBets] = useState<Map<string, PlacedBet>>(new Map());
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [displayHistory, setDisplayHistory] = useState<any[]>([]);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [pendingSpinData, setPendingSpinData] = useState<any>(null);
  const [bettingDeadline, setBettingDeadline] = useState<number>(0);
  const [dismissedSpinId, setDismissedSpinId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [events, setEvents] = useState<BettingEvent[]>([]);
  const [prevLeaderId, setPrevLeaderId] = useState<string | null>(null);
  const announcedElimId = useRef<string | null>(null);
  const announcedLeaderId = useRef<string | null>(null);
  const announcedBettingSpinArr = useRef<string[]>([]);

  // Refs for stable closures
  const phaseRef = useRef<TournamentPhase>('waiting');
  const roundIdRef = useRef<string | null>(null);
  const betsRef = useRef<Map<string, PlacedBet>>(new Map());
  const lastResetKeyRef = useRef<string>('');
  const generatedRef = useRef<string>('');
  const spinSubmittedRef = useRef<string>(''); // Tracks "round-spin" key for submissions
  const isFetchingRef = useRef(false); // Prevent concurrent polls
  const hasRestoredBetsRef = useRef(false);

  const [wheelType, setWheelTypeState] = useState<'american' | 'european'>('american');

  phaseRef.current = phase;
  roundIdRef.current = roundId;
  betsRef.current = bets;

  const totalSpins = 5;
  
  // Clear betting events and play announcement when a new betting phase starts
  useEffect(() => {
    if (phase === 'betting') {
      setEvents([]);
      
      const spinKey = `${currentRound}-${currentSpin}`;
      if (!announcedBettingSpinArr.current.includes(spinKey)) {
        // High-roller timing: delay for Match Found screen (2.5s) on initial spin
        const isVeryStart = currentRound === 1 && currentSpin === 1;
        const delay = isVeryStart ? 2800 : 500;
        
        setTimeout(() => {
          if (phaseRef.current === 'betting') {
            soundEngine?.playPlaceBetsSound?.();
          }
        }, delay);

        announcedBettingSpinArr.current.push(spinKey);
        // Keep only last 10 spin keys to avoid memory growth
        if (announcedBettingSpinArr.current.length > 10) {
          announcedBettingSpinArr.current.shift();
        }
      }
    }
  }, [phase, currentSpin, currentRound]);

  // ════════════════════════════════════════════════════════════
  // submitBets — locks bets in and waits for server watchdog to spin
  // ════════════════════════════════════════════════════════════
  const submitBets = useCallback(async (currentBets: any) => {
    const rId = roundIdRef.current;
    if (!id || !rId) return;

    const spinKey = `${currentRound}-${currentSpin}`;
    if (spinSubmittedRef.current === spinKey) {
      console.log('[Tournament] Bets already locked for', spinKey);
      return;
    }
    spinSubmittedRef.current = spinKey;
    
    // The player's UI changes to "LOCKED" waiting for others or the deadline
    setPhase('locked');
    soundEngine?.playLockSound();

    try {
      const player = tournament?.players?.find(p => 
        (userProfile.id && p.player_id.toString() === userProfile.id) ||
        (p.username === userProfile.name && !p.is_bot)
      );
      
      if (!player) return;

      const res = await fetch(`/api/tournament/${id}/bets/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player.player_id,
          bets: currentBets,
          round_id: rId,
        }),
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         console.error('[Tournament] Bet lock server error:', errorData.error || res.statusText);
         
         // RECOVERY: If submission failed, revert to betting so user can try again or wait for auto-sub
         setPhase('betting');
         spinSubmittedRef.current = ''; 
      }
      
      // We do not set the spin data locally here. 
      // The 2s loop in `loadTournament` will detect the state change to "spinning" 
      // automatically based on everyone being locked or the timer expiring.
    } catch (err) {
      console.error('[Tournament] submitBets error:', err);
      // RECOVERY
      setPhase('betting');
      spinSubmittedRef.current = '';
    }
  }, [id, currentRound, currentSpin, userProfile, tournament]);

  // ════════════════════════════════════════════════════════════
  // loadTournament — single polling source of truth
  // ════════════════════════════════════════════════════════════
  const loadTournament = useCallback(async () => {
    if (!id || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const now = Date.now();
      const res = await fetch(`/api/tournament/${id}`);
      if (!res.ok) throw new Error('Tournament not found');

      const data = await res.json();
      const serverPhase = data.calculated_phase as TournamentPhase;

      setTournament(data);
      setCurrentRound(data.current_round || 1);
      
      // ── Restore local bets from server if we just reloaded/reconnected ──
      const localBets = betsRef.current;
      if (!hasRestoredBetsRef.current && localBets.size === 0 && data.players && data.status === 'active' && phaseRef.current === 'betting') {
        const me = data.players.find((p: any) => 
          (userProfile.id && p.player_id.toString() === userProfile.id) ||
          (p.username === userProfile.name && !p.is_bot)
        );
        
        if (me?.pending_bets && me.pending_bets.length > 0) {
          console.log('[Tournament] Restoring pending bets from server sync...');
          hasRestoredBetsRef.current = true;
          const restoredMap = new Map<string, PlacedBet>();
          me.pending_bets.forEach((b: any) => {
            const existing = restoredMap.get(b.betId);
            if (existing) {
              restoredMap.set(b.betId, {
                ...existing,
                amount: existing.amount + b.amount,
                chips: [...existing.chips, ...(b.chips || [b.amount])]
              });
            } else {
              restoredMap.set(b.betId, {
                betId: b.betId,
                amount: b.amount,
                chips: b.chips || [b.amount]
              });
            }
          });
          setBets(restoredMap);
        }
      }
      
      if (data.history) {
        setRawHistory(data.history);
      }
      
      if (data.wheel_type && data.wheel_type !== wheelType) {
        setWheelTypeState(data.wheel_type);
      }
      
      setError(null);

      // Sync server time offset once per poll
      if (data.server_time) {
        setServerTimeOffset(data.server_time - now);
      }

      // Lobby countdown
      if (data.status === 'waiting' && data.created_at) {
        const created = new Date(data.created_at).getTime();
        const serverTime = Date.now() + (data.server_time - now);
        const elapsed = Math.floor((serverTime - created) / 1000);
        setLobbyTimeRemaining(Math.max(0, 30 - elapsed));
      }

      // ── Active round data ──
      if (data.active_round) {
        const round = data.active_round;
        const newRoundId = round._id?.toString();

        if (newRoundId !== roundIdRef.current) {
          setRoundId(newRoundId);
          setCurrentRoundData(round);
          hasRestoredBetsRef.current = false; // Reset on new round
        } else if (round.spins_completed !== currentRoundData?.spins_completed) {
          setCurrentRoundData(round);
          hasRestoredBetsRef.current = false; // Reset on new spin
        }

        const spinsDone = round.spins_completed || 0;
        let actualCurrentSpin = spinsDone + 1;

        // If we are spinning or showing result, the current spin is the one we are watching (latest processed)
        const localPhase = phaseRef.current;
        if ((localPhase === 'spinning' || localPhase === 'result' || serverPhase === 'spinning' || serverPhase === 'result') && data.latest_spin) {
          if (data.latest_spin.round_id?.toString() === round._id?.toString()) {
            actualCurrentSpin = data.latest_spin.spin_number;
          }
        }
        
        setCurrentSpin(Math.min(5, actualCurrentSpin));

        // ── Betting deadline and timer ──
        if (data.betting_deadline && serverPhase === 'betting') {
          const deadline = data.betting_deadline as number;
          setBettingDeadline(deadline);
        } else {
          setBettingDeadline(0);
          setTimeRemaining(0);
        }
      }

      // ── Server-authoritative phase sync ──
      const currentPriority = PHASE_PRIORITY[phaseRef.current] ?? 0;
      const serverPriority = PHASE_PRIORITY[serverPhase] ?? 0;

      // Only allow server to advance phase forward, or reset to betting for a new spin
      // GUARD: Don't jump to betting if we are still animating a spin or showing a result locally
      if (serverPhase === 'betting' && (phaseRef.current === 'spinning' || phaseRef.current === 'result')) {
        // Keep spinning or result phase locally until wheel/popup completion logic triggers
        // Exception: If server is already halfway through the next betting round, force sync
        if (data.active_round?.betting_ends_at) {
          const deadline = new Date(data.active_round.betting_ends_at).getTime();
          const serverNow = Date.now() + (data.server_time - now);
          // If less than 28s remaining in 30s window, we've stayed in result too long
          if (deadline - serverNow < 28000) {
            setPhase('betting');
          }
        }
      } else if (serverPhase === 'betting' && phaseRef.current === 'locked') {
        // STAY LOCKED while server is still in betting phase
      } else if (serverPhase === 'result' && phaseRef.current === 'spinning') {
        // Keep spinning until wheel animation completes
      } else if (serverPriority > currentPriority || serverPhase === 'betting') {
        const spinId = data.latest_spin?.id || `${data.latest_spin?.round_id}-${data.latest_spin?.spin_number}`;
        if (serverPhase === 'result' && dismissedSpinId === spinId) {
          // Stay in betting phase if user already dismissed this result
          setPhase('betting');
        } else {
          setPhase(serverPhase);
        }
      }

      // ── Manage result popup visibility ──
      if (serverPhase === 'spinning') {
        setShowResult(false);
      } else if (serverPhase === 'result') {
        // Only show popup if not already dismissed for this spin
        const spinId = data.latest_spin?.id || `${data.latest_spin?.round_id}-${data.latest_spin?.spin_number}`;
        if (spinId !== dismissedSpinId && phaseRef.current !== 'spinning') {
          setShowResult(true);
        }
      }

      // ── Recover spin result if spinning/result and we have no local data ──
      if ((serverPhase === 'spinning' || serverPhase === 'result') && data.latest_spin) {
        const ls = data.latest_spin;
        // Verify this spin belongs to the current round
        if (ls.round_id?.toString() === data.active_round?._id?.toString()) {
          // If we don't have a result yet, or the server has a NEWER spin than our local last result
          const currentRes = lastSpinResult as any;
          if (!currentRes || ls.spin_number > currentRes.spin_number) {
             setLastSpinResult({
               ...ls.result,
               spin_number: ls.spin_number,
               id: ls._id || `${ls.round_id}-${ls.spin_number}`,
             } as any);
             
             const combinedBets: any[] = [];
             ls.player_results?.forEach((pr: any) => pr.bets_placed?.forEach((b: any) => combinedBets.push(b)));
             setAllSpinBets(combinedBets);
          }
        }
      }

      // ── Eliminated player for animation ──
      if (serverPhase === 'elimination') {
        const elim = (data.players || []).find((p: any) => p.status === 'eliminated' && p.eliminated_round === (data.current_round - 1));
        if (elim) setEliminatedPlayer(elim);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [id, serverTimeOffset, currentRoundData?.spins_completed, lastSpinResult, dismissedSpinId]);

  // ── Initial load ──
  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  // ── Poll for tournament updates ──
  useEffect(() => {
    if (!id || (tournament && tournament.status === 'completed')) return;

    let timeoutId: any;
    const poll = async () => {
      await loadTournament();
      // Throttle background polling to 15s to prevent catch-up bursts on focus
      const isHidden = typeof document !== 'undefined' && document.hidden;
      timeoutId = setTimeout(poll, isHidden ? 15000 : 1000);
    };

    poll();
    return () => clearTimeout(timeoutId);
  }, [id, loadTournament, tournament?.status]);

  // ── Smooth lobby timer ──
  useEffect(() => {
    if (tournament?.status !== 'waiting' || !tournament?.created_at) return;

    const updateLobbyTimer = () => {
      const created = new Date(tournament.created_at).getTime();
      const localNow = Date.now() + serverTimeOffset;
      const elapsed = Math.floor((localNow - created) / 1000);
      setLobbyTimeRemaining(Math.max(0, 30 - elapsed));
    };

    const interval = setInterval(updateLobbyTimer, 100);
    return () => clearInterval(interval);
  }, [tournament?.status, tournament?.created_at, serverTimeOffset]);

  // ── Auto-start round if tournament active but no round exists ──
  useEffect(() => {
    if (tournament?.status === 'active' && phase === 'betting' && !roundIdRef.current && id) {
      console.log('[Tournament] Active but no round found, requesting init...');
      fetch(`/api/tournament/${id}/round/start`, { method: 'POST' }).catch(console.error);
    }
  }, [tournament?.status, phase, id]);

  // ── Smooth local timer countdown ──
  useEffect(() => {
    // Keep timer active during locked phase so player sees countdown
    const isBettingOrLocked = (phase === 'betting' || phase === 'locked');
    if (!isBettingOrLocked || bettingDeadline <= 0) {
      if (!isBettingOrLocked) setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const localNow = Date.now() + serverTimeOffset;
      const remaining = Math.max(0, Math.ceil((bettingDeadline - localNow) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 100); // 100ms for high accuracy
    return () => clearInterval(timerInterval);
  }, [phase, bettingDeadline, serverTimeOffset]);

  // ── Auto-submit bets when deadline hits (client-side) ──
  useEffect(() => {
    if (phase !== 'betting' || bettingDeadline <= 0) return;

    const checkDeadline = setInterval(() => {
      const localNow = Date.now() + serverTimeOffset;
      if (localNow >= bettingDeadline) {
        const spinKey = `${currentRound}-${currentSpin}`;
        if (spinSubmittedRef.current !== spinKey) {
          console.log('[Tournament] Deadline hit — auto-submitting');
          submitBets(Array.from(betsRef.current.values()));
        }
        clearInterval(checkDeadline);
      }
    }, 500);

    return () => clearInterval(checkDeadline);
  }, [phase, bettingDeadline, serverTimeOffset, currentRound, currentSpin, submitBets]);

  // ── Reset table on new spin ──
  useEffect(() => {
    const key = `${currentRound}-${currentSpin}`;
    if (phase === 'betting' && lastResetKeyRef.current !== key) {
      console.log('[Tournament] Resetting board for', key);
      
      // Reset restoration flag so we can potentially restore for THIS spin if we refresh later
      hasRestoredBetsRef.current = false;
      
      setBets(new Map());
      setAllSpinBets([]);
      setLastPlayerPayout(null);
      setLastSpinResult(null); // Clear previous result so wheel can re-trigger
      lastResetKeyRef.current = key;

      
      // IMPORTANT: After resetting locally, we mark as 'restored' so the poller 
      // doesn't pull old bets from the server before it has had a chance to clear them.
      // This will only be false again if the page is refreshed.
      hasRestoredBetsRef.current = true;
    }
  }, [phase, currentRound, currentSpin]);


  // ── Schedule bot bet reveals ──
  useEffect(() => {
    if (phase !== 'betting' || !currentRoundData?.bot_bets) return;
    const key = `${currentRound}-${currentSpin}`;
    if (generatedRef.current === key) return;

    console.log('[Tournament] Scheduling bot reveals for', key);
    setBotBets([]);
    const spinBotBets = (currentRoundData.bot_bets || []).filter((b: any) => b.spin_number === currentSpin);
    
    // We calculate how much time has already passed in this 30s betting window
    // to ensure bots reveal at the correct absolute time even after a refresh.
    const serverNow = Date.now() + serverTimeOffset;
    const startTime = bettingDeadline - 30000;
    const elapsed = Math.max(0, serverNow - startTime);
    
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    spinBotBets.forEach((bet: any) => {
      // reveal_at_ms is the intended delay from the START of the betting phase (0-30000ms)
      const intendedDelay = bet.reveal_at_ms || 0;
      const remainingDelay = Math.max(0, intendedDelay - elapsed);
      
      // If the bet was already supposed to be revealed, show it with a tiny random jitter
      const finalDelay = remainingDelay > 0 ? remainingDelay : (Math.random() * 1000);

      timeouts.push(setTimeout(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        
        setBotBets(prev => {
          if (prev.some((b: any) => b.betId === bet.betId)) return prev;
          
          const playerIdx = tournament?.players?.findIndex(p => p.player_id.toString() === bet.player_id.toString()) ?? 0;
          const playerColor = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];

          setEvents(curr => [
            {
              id: `${bet.betId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              username: bet.username,
              amount: bet.amount,
              betId: bet.betId,
              timestamp: Date.now(),
              color: playerColor
            },
            ...curr.slice(0, 19)
          ]);

          return [...prev, { player_id: bet.player_id, username: bet.username, betId: bet.betId, amount: bet.amount, chips: bet.chips }];
        });
      }, finalDelay));
    });

    generatedRef.current = key;
    return () => {
      console.log('[Tournament] Cleaning up bot reveals for', key);
      timeouts.forEach(clearTimeout);
    };
  }, [phase, currentRound, currentSpin, !!currentRoundData]);


  // Consolidated dismissResult
  const dismissResult = useCallback(() => {
    if (lastSpinResult?.id) {
      setDismissedSpinId(lastSpinResult.id);
    }
    setShowResult(false);
    // If we are currently in result phase (from server), we can stay in it but hide popup
    // Or if we want to force betting phase:
    // setPhase('betting');
    
    // Sync history when result is acknowledged/dismissed
    setDisplayHistory(rawHistory);
  }, [lastSpinResult, rawHistory]);

  // ── completeSpin: called when wheel animation ends ──
  const completeSpin = useCallback(() => {
    if (!pendingSpinData) {
      // Recover from server if we have a lastSpinResult (reconnect case)
      if (lastSpinResult) setPhase('result');
      return;
    }

    setPhase('result');
    setShowResult(true);
    const data = pendingSpinData;

    const myResult = userProfile.id
      ? data.player_results?.find((pr: any) => pr.player_id?.toString() === userProfile.id)
      : data.player_results?.find((pr: any) => !pr.is_bot);

    if (myResult) {
      const totalWagered = myResult.bets_placed?.reduce((a: number, b: any) => a + b.amount, 0) || 0;
      setLastPlayerPayout({
        netResult: myResult.net_change,
        totalWagered,
        totalReturned: myResult.net_change + totalWagered,
      });
    }

    setTournament(prev => {
      if (!prev) return null;
      const updatedPlayers = prev.players.map(p => ({
        ...p,
        current_chips: Math.max(0, data.chip_updates?.[p.player_id.toString()] ?? p.current_chips),
      }));
      return { ...prev, players: updatedPlayers };
    });

    setPendingSpinData(null);

    // Audio Feedback for the human player
    if (myResult) {
      if (myResult.net_change > 0) {
        soundEngine?.playWinSound?.();
      } else if (myResult.net_change < 0) {
        soundEngine?.playLossSound?.();
      }
    }
  }, [pendingSpinData, lastSpinResult, userProfile.id]);

  // ── addEvent — manually push event to feed ──
  const addEvent = useCallback((event: Omit<BettingEvent, 'id' | 'timestamp'>) => {
    setEvents(curr => [
      {
        ...event,
        id: `${event.betId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: Date.now()
      },
      ...curr.slice(0, 19)
    ]);
  }, []);

  // ── Sync My Bets ──
  const syncMyBets = useCallback(async (currentBets: any[]) => {
    if (!id || phase !== 'betting' || currentBets.length === 0) return;

    const player = tournament?.players?.find(p =>
      (userProfile.id && p.player_id.toString() === userProfile.id) ||
      (p.username === userProfile.name && !p.is_bot)
    );
    if (!player) return;

    try {
      await fetch(`/api/tournament/${id}/bets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player.player_id, bets: currentBets }),
      });
    } catch (e) {
      // Silent — not critical
    }
  }, [id, userProfile.id, userProfile.name, tournament, phase]);

  // Implement result dismissal

  // Update display history only when appropriate
  useEffect(() => {
    // If not in spinning or result phase, sync immediately
    if (phase !== 'spinning' && phase !== 'result') {
      setDisplayHistory(rawHistory);
    }
  }, [rawHistory, phase]);



  // ── declareWinner ──
  const declareWinner = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/tournament/${id}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Completion failed');
      const data = await res.json();
      setTournament(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'completed',
          winner_id: data.winner.player_id,
          players: prev.players?.map(p => {
            const standing = data.standings?.find((s: any) => s.player_id.toString() === p.player_id.toString());
            return standing
              ? { ...p, status: (standing.position === 1 ? 'completed' : 'eliminated') as any, final_position: standing.position, current_chips: standing.final_chips }
              : p;
          }),
        };
      });
      setPhase('completed');
    } catch {
      setPhase('completed');
    }
  }, [id]);

  const updateWheelType = useCallback(async (type: 'american' | 'european') => {
    if (!id) return;
    
    // Optimistic update
    setWheelTypeState(type);
    
    try {
      const res = await fetch(`/api/tournament/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wheel_type: type }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update wheel type');
      }
      
      // Update local tournament object too
      setTournament(prev => prev ? { ...prev, wheel_type: type } : null);
    } catch (err) {
      console.error('[Tournament] updateWheelType error:', err);
      // Revert on error? Or just leave it, next poll will fix it
    }
  }, [id]);

  // ── Derived state ──
  const activePlayers = useMemo(() =>
    tournament?.players?.filter(p => p.status === 'active') || [],
    [tournament]
  );

  const eliminatedPlayers = useMemo(() =>
    tournament?.players?.filter(p => p.status === 'eliminated') || [],
    [tournament]
  );

  const scores = useMemo(() => {
    if (!tournament) return [];
    const active = (tournament.players || []).filter(p => p.status === 'active').sort((a, b) => b.current_chips - a.current_chips);
    const eliminated = (tournament.players || []).filter(p => p.status === 'eliminated').sort((a, b) => (a.final_position || 10) - (b.final_position || 10));
    
    const players = [...active, ...eliminated].map((p, index) => {
      // Find original index in tournament.players to keep color stable
      const originalIndex = tournament.players?.findIndex(tp => tp.player_id.toString() === p.player_id.toString()) ?? index;
      
      // Calculate current wager
      let currentWager = 0;
      if (p.is_bot) {
        // Sum bot bets for this spin
        currentWager = botBets
          .filter(bb => bb.player_id.toString() === p.player_id.toString())
          .reduce((sum, bb) => sum + (bb.amount || 0), 0);
      } else {
        // Human player wagers
        currentWager = Array.from(bets.values()).reduce((sum, b) => sum + b.amount, 0);
      }

      return {
        player_id: p.player_id,
        username: p.username,
        chips: Math.max(0, p.current_chips),
        rank: p.status === 'active' ? index + 1 : (p.final_position || 0),
        is_bot: p.is_bot,
        status: p.status,
        final_position: p.final_position,
        has_champion_badge: p.has_champion_badge,
        color: PLAYER_COLORS[originalIndex % PLAYER_COLORS.length],
        currentWager,
        points_earned: p.points_earned
      };
    });

    return players;
  }, [tournament, botBets, bets]);

  // ── Announce Leader Changes & Eliminations ──
  useEffect(() => {
    if (phase === 'betting' || phase === 'result' || phase === 'elimination') {
      const leader = scores.find(s => s.rank === 1 && s.status === 'active');
      if (leader && leader.player_id.toString() !== announcedLeaderId.current) {
        // Only announce if it's not the very first load
        if (announcedLeaderId.current && (phase === 'result' || phase === 'betting')) {
          soundEngine?.announceNewLeader?.(leader.username);
        }
        announcedLeaderId.current = leader.player_id.toString();
        setPrevLeaderId(leader.player_id.toString());
      }
    }
  }, [scores, phase]);

  useEffect(() => {
    if (eliminatedPlayer && phase === 'elimination') {
      const elimId = eliminatedPlayer.player_id.toString();
      if (announcedElimId.current !== elimId) {
        soundEngine?.announceElimination?.(eliminatedPlayer.username);
        announcedElimId.current = elimId;
      }
    } else if (phase === 'betting') {
       // Reset for next round
       announcedElimId.current = null;
    }
  }, [eliminatedPlayer, phase]);

  const totalBet = useMemo(() =>
    Array.from(bets.values()).reduce((sum, bet) => sum + bet.amount, 0),
    [bets]
  );

  const value = useMemo(() => ({
    tournament,
    currentRound,
    currentSpin,
    totalSpins,
    phase,
    activePlayers,
    eliminatedPlayers,
    scores,
    timeRemaining,
    setPhase,
    submitBets,
    completeSpin,
    lastSpinResult,
    lastPlayerPayout,
    allSpinBets,
    botBets,
    eliminatedPlayer,
    dismissResult,
    declareWinner,
    isLoading,
    error,
    lobbyTimeRemaining,
    syncMyBets,
    bets,
    setBets,
    totalBet,
    history: displayHistory,
    showResult,
    events,
    addEvent,
    wheelType,
    updateWheelType,
  }), [
    tournament,
    currentRound,
    currentSpin,
    totalSpins,
    phase,
    activePlayers,
    eliminatedPlayers,
    scores,
    timeRemaining,
    setPhase,
    submitBets,
    completeSpin,
    lastSpinResult,
    lastPlayerPayout,
    allSpinBets,
    botBets,
    eliminatedPlayer,
    dismissResult,
    declareWinner,
    isLoading,
    error,
    lobbyTimeRemaining,
    syncMyBets,
    bets,
    setBets,
    totalBet,
    displayHistory,
    showResult,
    events,
    addEvent
  ]);

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentContext() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournamentContext must be used within a TournamentProvider');
  }
  return context;
}
