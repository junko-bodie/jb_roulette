'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Tournament, TournamentPlayer } from '@/lib/models/Tournament';
import { PlacedBet } from '../bets';
import { calculatePayouts } from '../payouts';
import { SpinResult } from '../rng';
import { useGame } from '@/context/GameContext';

export type TournamentPhase = 
  | "waiting"
  | "betting" 
  | "locked" 
  | "spinning" 
  | "result" 
  | "elimination" 
  | "round_complete" 
  | "completed";

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
    status: "active" | "eliminated";
    final_position?: number | null;
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
  declareWinner: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lobbyTimeRemaining: number;
  syncMyBets: (bets: any[]) => Promise<void>;
  bets: Map<string, PlacedBet>;
  setBets: React.Dispatch<React.SetStateAction<Map<string, PlacedBet>>>;
  totalBet: number;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params?.id as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const { userProfile } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [phase, setPhase] = useState<TournamentPhase>("betting");
  const [currentRound, setCurrentRound] = useState(1);
  const [currentSpin, setCurrentSpin] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [botBets, setBotBets] = useState<any[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [lastSpinResult, setLastSpinResult] = useState<any>(null);
  const [allSpinBets, setAllSpinBets] = useState<any[]>([]);
  const [pendingSpinData, setPendingSpinData] = useState<any>(null);
  const [lastPlayerPayout, setLastPlayerPayout] = useState<any>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<any>(null);
  const [lobbyTimeRemaining, setLobbyTimeRemaining] = useState<number>(60);
  const [currentRoundData, setCurrentRoundData] = useState<any>(null);
  const [bets, setBets] = useState<Map<string, PlacedBet>>(new Map());
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const startTriggeredRef = useRef(false);
  const autoSubmitRef = useRef<string>("");

  const totalSpins = 20;

  // Start round logic
  const startRound = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/tournament/${id}/round/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start round');
      const data = await res.json();
      setRoundId(data._id);
      setCurrentRoundData(data);
      setCurrentSpin(data.spins_completed + 1);
      setPhase("betting");
      generatedRef.current = ""; // Reset bot bet generation for new round
    } catch (e) {
      console.error('Error starting round:', e);
    }
  }, [id]);

  // ════════════ TOURNAMENT LOADING & LOBBY POLLING ════════════
  const loadTournament = useCallback(async () => {
    if (!id) return;
    try {
      const now = Date.now();
      const res = await fetch(`/api/tournament/${id}`);
      if (!res.ok) throw new Error('Tournament not found');
      const data = await res.json();
      
      setTournament(data);
      setCurrentRound(data.current_round || 1);
      
      // Calculate remaining lobby time based on created_at
      if (data.status === 'waiting' && data.created_at) {
        const created = new Date(data.created_at).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - created) / 1000);
        setLobbyTimeRemaining(Math.max(0, 60 - elapsed));
      }
      
      setError(null);
      
      // SYNC: Update round data and timer based on server-provided betting_ends_at
      if (data.active_round) {
        setCurrentRoundData(data.active_round);
        setRoundId(data.active_round._id);
        setCurrentSpin(Math.min(5, (data.active_round.spins_completed || 0) + 1));
        
        if (data.server_time) {
          setServerTimeOffset(data.server_time - Date.now());
        }

        if (data.calculated_phase && data.calculated_phase !== "waiting") {
          // Robust phase synchronization
          if (data.calculated_phase === "spinning" || data.calculated_phase === "result") {
            setPhase(data.calculated_phase);
          } else if (phase !== "spinning" && phase !== "elimination") {
            setPhase(data.calculated_phase);
          }
        }

        // SYNC: Update time remaining based on server-provided deadline
        if (data.betting_deadline) {
          const deadline = new Date(data.betting_deadline).getTime();
          const serverNow = data.server_time || Date.now();
          const diff = Math.max(0, Math.floor((deadline - serverNow) / 1000));
          
          if (phase === "betting" || phase === "locked" || !currentRoundData) {
            setTimeRemaining(diff);
            
            if (diff === 0 && phase === "betting" && !isLoading) {
              const key = `${currentRound}-${currentSpin}`;
              if (autoSubmitRef.current !== key) {
                autoSubmitRef.current = key;
                setPhase("locked");
                submitBets(Array.from(bets.values()));
              }
            }
          }
        }

        // Recover spin/result state from latest_spin if we are in those phases
        if ((data.calculated_phase === "spinning" || data.calculated_phase === "result") && data.latest_spin) {
          if (data.latest_spin.round_id.toString() === data.active_round?._id?.toString() && 
              data.latest_spin.spin_number === data.active_round?.spins_completed + 1) {
            
            const combinedBets: any[] = [];
            data.latest_spin.player_results?.forEach((pr: any) => {
              pr.bets_placed?.forEach((b: any) => combinedBets.push(b));
            });
            
            setAllSpinBets(combinedBets);
            setLastSpinResult(data.latest_spin.result);
          }
        }

        // Automate transition to elimination or completed if server says so
        if (data.calculated_phase === "elimination" && phase !== "elimination") {
          runElimination();
        } else if (data.calculated_phase === "completed" && phase !== "completed") {
          declareWinner();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]); // Remove phase from dependencies to avoid infinite loops

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  // Poll for tournament state while waiting or active
  useEffect(() => {
    if (!tournament || (tournament.status !== 'waiting' && tournament.status !== 'active')) return;

    const pollInterval = setInterval(() => {
      loadTournament();
    }, 500); 

    return () => clearInterval(pollInterval);
  }, [tournament?.status, loadTournament]);

  // Automatically start NEW rounds (Round 2, 3, etc.)
  useEffect(() => {
    if (!id || !tournament || tournament.status !== 'active' || isLoading) return;
    
    // If we are in betting phase but don't have an active round document,
    // initialize the next round.
    if (!roundId && phase === "betting") {
      console.log(`[Tournament] Round ${currentRound} state is missing. Initializing next round...`);
      startRound();
    }
  }, [id, tournament?.status, phase, roundId, currentRound, startRound, isLoading]);

  // Polling for other players' bets during betting phase
  useEffect(() => {
    if (phase !== "betting" || !id) return;

    const pollBets = async () => {
      try {
        const res = await fetch(`/api/tournament/${id}/bets`);
        if (res.ok) {
          const data = await res.json();
          setTournament(prev => {
            if (!prev) return null;
            const updatedPlayers = prev.players.map(p => {
              const freshData = data.bets?.find((b: any) => b.player_id.toString() === p.player_id.toString());
              if (freshData) {
                return { ...p, pending_bets: freshData.pending_bets };
              }
              return p;
            });
            return { ...prev, players: updatedPlayers };
          });
        }
      } catch (e) {
        console.error('Failed to poll bets:', e);
      }
    };

    const interval = setInterval(pollBets, 500); // Increased polling frequency for better responsiveness
    pollBets();
    return () => clearInterval(interval);
  }, [phase, id, loadTournament]);

  // RESET TABLE: Clear all bets when entering a new betting phase for a new spin
  const lastResetRef = useRef<string>("");
  useEffect(() => {
    const key = `${currentRound}-${currentSpin}`;
    if (phase === "betting" && lastResetRef.current !== key) {
      console.log(`[Tournament] Resetting board for ${key}`);
      setBets(new Map());
      setAllSpinBets([]);
      setBotBets([]);
      setLastPlayerPayout(null);
      lastResetRef.current = key;
    }
  }, [phase, currentRound, currentSpin]);

  // Periodic Bet Syncing — ensure server has latest table state for recovery
  useEffect(() => {
    if (!id || !userProfile?.id || phase !== 'betting') return;

    const syncInterval = setInterval(async () => {
      try {
        const currentBets = Array.from(bets.values());
        if (currentBets.length === 0) return;

        await fetch(`/api/tournament/${id}/bets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_id: userProfile.id,
            bets: currentBets
          })
        });
      } catch (error) {
        console.warn('[Tournament] Bet sync failed (silent)', error);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [id, userProfile?.id, bets, phase]);

  // Matchmaking countdown timer
  useEffect(() => {
    if (!tournament || tournament.status !== 'waiting') return;

    const timer = setInterval(() => {
      setLobbyTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tournament?.status]);

  // Automatically start tournament when lobby is full or time's up
  useEffect(() => {
    if (!id || !tournament || tournament.status !== 'waiting' || startTriggeredRef.current) return;

    const shouldStart = lobbyTimeRemaining <= 0 || (tournament.players?.length || 0) >= 6;

    if (shouldStart) {
      startTriggeredRef.current = true;
      const startTournament = async () => {
        try {
          const res = await fetch(`/api/tournament/${id}/start`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            setTournament(data);
            
            // If the server already created the first round, set it immediately
            if (data.active_round) {
              setCurrentRoundData(data.active_round);
              setRoundId(data.active_round._id);
              setCurrentSpin(data.active_round.spins_completed + 1);
              
              if (data.active_round.betting_ends_at) {
                const end = new Date(data.active_round.betting_ends_at).getTime();
                const now = Date.now();
                const diff = Math.max(0, Math.floor((end - now) / 1000));
                setTimeRemaining(diff);
              }
            }
          }
        } catch (e) {
          console.error('Failed to start tournament:', e);
          startTriggeredRef.current = false; // Allow retry on next trigger
        } finally {
          setIsLoading(false);
          setPhase("betting");
          setBets(new Map());
          generatedRef.current = "";
        }
      };
      startTournament();
    }
  }, [id, tournament, lobbyTimeRemaining]);

  // Elimination logic
  const runElimination = useCallback(async () => {
    if (!id || !roundId) return;
    setPhase("elimination");
    
    try {
      const res = await fetch(`/api/tournament/${id}/round/${roundId}/eliminate`, { method: 'POST' });
      if (!res.ok) throw new Error('Elimination failed');
      
      const data = await res.json();
      setEliminatedPlayer(data.eliminatedPlayer);
      
      // Update local tournament state
      setTournament(prev => {
        if (!prev) return null;
        const updatedPlayers = prev.players?.map(p => {
          if (p.player_id.toString() === data.eliminatedPlayer.player_id.toString()) {
            return {
              ...p,
              status: "eliminated" as const,
              eliminated_round: prev.current_round,
              final_position: data.eliminatedPlayer.position
            };
          }
          return p;
        });
        return {
          ...prev,
          players: updatedPlayers,
          current_round: data.nextRound
        };
      });

      // Show for 3 seconds, then move out of elimination phase
      setTimeout(() => {
        const wasRealPlayer = !data.eliminatedPlayer.is_bot;
        if (wasRealPlayer) {
          setPhase("completed"); // Or a summary phase
        } else if (data.nextRound > 5) {
          setPhase("completed");
        } else {
          setCurrentRound(data.nextRound);
          setRoundId(null); // This will trigger startRound via useEffect
          setPhase("betting");
          setCurrentSpin(1);
          setTimeRemaining(30);
        }
      }, 3000);

    } catch (e) {
      console.error('Error in elimination:', e);
      setPhase("betting"); // Fallback
    }
  }, [id, roundId]);

  // Ensure a round document exists when tournament is loaded
  useEffect(() => {
    if (tournament && !roundId && !isLoading) {
      startRound();
    }
  }, [tournament, roundId, isLoading, startRound]);

  // Derived state
  const activePlayers = useMemo(() => 
    tournament?.players?.filter(p => p.status === "active") || []
  , [tournament]);

  const eliminatedPlayers = useMemo(() => 
    tournament?.players?.filter(p => p.status === "eliminated") || []
  , [tournament]);

  const scores = useMemo(() => {
    if (!tournament) return [];
    
    const active = (tournament.players || [])
      .filter(p => p.status === "active")
      .sort((a, b) => b.current_chips - a.current_chips);
      
    const eliminated = (tournament.players || [])
      .filter(p => p.status === "eliminated")
      .sort((a, b) => (a.final_position || 10) - (b.final_position || 10)); // Higher position first? or lower? 
      // Pos 6 is Round 1. Pos 5 is Round 2. 
      // User says: "Eliminated players move to the bottom of the scoreboard"
      // So they should be sorted by elimination order if possible.
      
    return [...active, ...eliminated].map((p, index) => ({
      player_id: p.player_id,
      username: p.username,
      chips: p.current_chips,
      rank: p.status === "active" ? index + 1 : (p.final_position || 0),
      is_bot: p.is_bot,
      status: p.status,
      final_position: p.final_position
    }));
  }, [tournament]);

  const declareWinner = useCallback(async () => {
    if (!id) return;
    setPhase("elimination");
    
    try {
      const res = await fetch(`/api/tournament/${id}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Completion failed');
      
      const data = await res.json();
      setTournament(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: "completed",
          winner_id: data.winner.player_id,
          players: prev.players?.map(p => {
             const standing = data.standings.find((s: any) => s.player_id.toString() === p.player_id.toString());
             if (standing) {
               return {
                 ...p,
                 status: (standing.position === 1 ? "completed" : "eliminated") as any,
                 final_position: standing.position,
                 current_chips: standing.final_chips
               };
             }
             return p;
          })
        };
      });
      setPhase("completed");
    } catch (error) {
      console.error('Error declaring winner:', error);
      setPhase("completed");
    }
  }, [id]);

  // Track generated bets to avoid double-triggering when dependencies change
  const generatedRef = useRef<string>("");

  // Reveal Bot bets based on server-provided reveal_at_ms
  useEffect(() => {
    if (phase === "betting" && currentRoundData?.bot_bets) {
      const key = `${currentRound}-${currentSpin}`;
      if (generatedRef.current === key) return;
      
      console.log(`[Tournament] Scheduling bot reveals for ${key}`);
      setBotBets([]);
      
      const sessionBotBets = (currentRoundData.bot_bets || [])
        .filter((b: any) => b.spin_number === currentSpin);
      const timeouts: NodeJS.Timeout[] = [];
      
      // Anchor reveal delay to when the betting phase actually started for this spin
      const baseTime = new Date(currentRoundData.last_spin_completed_at || currentRoundData.created_at).getTime();

      sessionBotBets.forEach((bet: any) => {
        const revealTime = baseTime + (bet.reveal_at_ms || 0);
        const now = Date.now();
        const delay = Math.max(0, revealTime - now);
        
        const timerId = setTimeout(() => {
          setBotBets(prev => {
            const exists = prev.some((b: any) => b.betId === bet.betId);
            if (exists) return prev;
            return [...prev, {
              player_id: bet.player_id,
              username: bet.username,
              betId: bet.betId,
              amount: bet.amount,
              chips: bet.chips
            }];
          });
        }, delay);
        timeouts.push(timerId);
      });
      
      generatedRef.current = key;
      return () => timeouts.forEach(clearTimeout);
    }
  }, [phase, currentRound, currentSpin, currentRoundData?._id]);

  const submitBets = useCallback(async (bets: any) => {
    if (!id || !roundId) return;
    
    setPhase("locked");
    
    try {
      // Structure the payload to support multi-player logic on server
      const player_bets = [{
        player_id: userProfile.id,
        bets: bets
      }];

      console.log(`[Tournament] Submitting bets for tournament ${id}, round ${roundId}, spin ${currentSpin}`, {
        player_bets,
        bot_bets: botBets
      });
      
      const res = await fetch(`/api/tournament/${id}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_bets,
          bot_bets: botBets,
          round_id: roundId,
          spin_number: currentSpin
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Tournament] Spin API Error:', errorData);
        throw new Error(errorData.error || `Spin failed with status ${res.status}`);
      }
      const data = await res.json();
      
      // Combine all bets from the server to display during spin phase
      const combinedBets: any[] = [];
      data.player_results?.forEach((pr: any) => {
         pr.bets_placed?.forEach((b: any) => combinedBets.push(b));
      });
      setAllSpinBets(combinedBets);

      // OPTIMISTIC: Move to spinning phase
      setPhase("spinning");
      setLastSpinResult(data.result);
      setPendingSpinData(data);
    } catch (error) {
      console.error('Error submitting bets:', error);
      setPhase("betting");
      alert('Spin failed. Please try again.');
    }
  }, [id, roundId, currentSpin, botBets]);

  const syncMyBets = useCallback(async (bets: any[]) => {
    if (!id || !tournament || !userProfile.id) return;
    if (phase !== "betting") return; // Safety: only sync during betting
    
    // Find the specific player record for THIS user - handles both string and ObjectId
    const player = tournament.players.find(p => 
      p.player_id.toString() === userProfile.id || 
      (p.username === userProfile.name && !p.is_bot)
    );
    if (!player) {
      console.warn('[Tournament Sync] Could not find player record for', userProfile.name);
      return;
    }

    try {
      const player_id = player.player_id;
      console.log(`[Tournament Sync] Sending ${bets.length} bets for player ${player.username} (${player_id})`);
      
      const res = await fetch(`/api/tournament/${id}/bets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player_id,
          bets: bets
        })
      });
      
      if (!res.ok) {
        console.error('[Tournament Sync] API returned error:', await res.text());
      }
    } catch (e) {
      console.error('[Tournament] Failed to sync bets:', e);
    }
  }, [id, tournament, userProfile.id]);

  const completeSpin = useCallback(() => {
    if (!pendingSpinData) return;
    
    setPhase("result");
    const data = pendingSpinData;
    
    // Extract THIS player's result
    const myResult = userProfile.id ? 
      data.player_results.find((pr: any) => pr.player_id.toString() === userProfile.id) : 
      data.player_results.find((pr: any) => !pr.is_bot);

    if (myResult) {
      const totalWagered = myResult.bets_placed.reduce((a: number, b: any) => a + b.amount, 0);
      setLastPlayerPayout({
        netResult: myResult.net_change,
        totalWagered: totalWagered,
        totalReturned: myResult.net_change + totalWagered
      });
    }
    
    // Update local chip counts from API result
    setTournament(prev => {
      if (!prev) return null;
      const updatedPlayers = prev.players.map(p => ({
        ...p,
        current_chips: data.chip_updates?.[p.player_id.toString()] ?? p.current_chips
      }));
      return { ...prev, players: updatedPlayers };
    });

    console.log('[Tournament] Spin result applied locally. Awaiting server phase change...');
    setPendingSpinData(null);
  }, [pendingSpinData, userProfile.id, userProfile.name]);

  // Sync state to DB after important changes
  useEffect(() => {
    if (!tournament || !id || phase !== "result") return;

    const syncData = async () => {
      const chipMap: Record<string, number> = {};
      tournament.players.forEach(p => {
        chipMap[p.player_id.toString()] = p.current_chips;
      });

      try {
        await fetch(`/api/tournament/${id}/sync`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_chips: chipMap,
            current_round: currentRound
          })
        });
      } catch (e) {
        console.error('Failed to sync tournament state:', e);
      }
    };

    syncData();
  }, [tournament, id, phase, currentRound]);

  // Betting timer logic - synchronized with server timestamp
  useEffect(() => {
    if (phase !== "betting" || !currentRoundData?.betting_ends_at) {
      return;
    }

    const timer = setInterval(() => {
      const end = new Date(currentRoundData.betting_ends_at).getTime();
      const now = Date.now() + serverTimeOffset;
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeRemaining(diff);
      
      // Automatic transition to locked/spin when time is up
      if (diff === 0 && phase === "betting") {
        const key = `${currentRound}-${currentSpin}`;
        if (autoSubmitRef.current !== key) {
          autoSubmitRef.current = key;
          console.log(`[Tournament] Auto-submitting bets for ${key}`);
          setPhase("locked");
          submitBets(Array.from(bets.values()));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentRoundData?.betting_ends_at, bets, currentRound, currentSpin, submitBets]);

  const totalBet = useMemo(() => 
    Array.from(bets.values()).reduce((sum, bet) => sum + bet.amount, 0)
  , [bets]);

  const value = {
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
    declareWinner,
    isLoading,
    error,
    lobbyTimeRemaining,
    syncMyBets,
    bets,
    setBets,
    totalBet
  };

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
