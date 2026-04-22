'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Tournament, TournamentPlayer } from '@/lib/models/Tournament';
import { generateBotBets } from './botBetting';
import { PlacedBet } from '../bets';
import { calculatePayouts } from '../payouts';
import { SpinResult } from '../rng';

export type TournamentPhase = 
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
  lastSpinResult: any;
  lastPlayerPayout: any;
  eliminatedPlayer: any;
  declareWinner: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params?.id as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [phase, setPhase] = useState<TournamentPhase>("betting");
  const [currentRound, setCurrentRound] = useState(1);
  const [currentSpin, setCurrentSpin] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [botBets, setBotBets] = useState<Record<string, PlacedBet[]>>({});
  const [roundId, setRoundId] = useState<string | null>(null);
  const [lastSpinResult, setLastSpinResult] = useState<any>(null);
  const [lastPlayerPayout, setLastPlayerPayout] = useState<any>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<any>(null);

  const totalSpins = 20;

  // Start round logic
  const startRound = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/tournament/${id}/round/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start round');
      const data = await res.json();
      setRoundId(data._id);
      setCurrentSpin(data.spins_completed + 1);
    } catch (e) {
      console.error('Error starting round:', e);
    }
  }, [id]);

  // Initial load and recovery
  useEffect(() => {
    async function loadTournament() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const res = await fetch(`/api/tournament/${id}`);
        if (!res.ok) throw new Error('Tournament not found');
        
        const data = await res.json();
        setTournament(data);
        setCurrentRound(data.current_round || 1);
        
        setPhase("betting");
        setTimeRemaining(30);
        
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTournament();
  }, [id]);

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
        const updatedPlayers = prev.players.map(p => {
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
    tournament?.players.filter(p => p.status === "active") || []
  , [tournament]);

  const eliminatedPlayers = useMemo(() => 
    tournament?.players.filter(p => p.status === "eliminated") || []
  , [tournament]);

  const scores = useMemo(() => {
    if (!tournament) return [];
    
    const active = tournament.players
      .filter(p => p.status === "active")
      .sort((a, b) => b.current_chips - a.current_chips);
      
    const eliminated = tournament.players
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
          players: prev.players.map(p => {
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

  const submitBets = useCallback(async (bets: any) => {
    if (!id || !roundId) return;
    
    setPhase("locked");
    
    try {
      const res = await fetch(`/api/tournament/${id}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_bets: bets,
          round_id: roundId,
          spin_number: currentSpin
        }),
      });

      if (!res.ok) throw new Error('Spin failed');
      const data = await res.json();
      
      setPhase("spinning");
      
      // Simulate spin delay
      setTimeout(() => {
        setPhase("result");
        setLastSpinResult(data.result);
        
        // Extract real player payout info
        const realPlayerResult = data.player_results.find((pr: any) => !pr.is_bot);
        if (realPlayerResult) {
          const totalWagered = realPlayerResult.bets_placed.reduce((a: number, b: any) => a + b.amount, 0);
          setLastPlayerPayout({
            netResult: realPlayerResult.net_change,
            totalWagered: totalWagered,
            totalReturned: realPlayerResult.net_change + totalWagered
          });
        }
        
        // Update local chip counts from API result
        setTournament(prev => {
          if (!prev) return null;
          const updatedPlayers = prev.players.map(p => ({
            ...p,
            current_chips: data.chip_updates[p.player_id.toString()] ?? p.current_chips
          }));
          return { ...prev, players: updatedPlayers };
        });

        setTimeout(() => {
          if (currentSpin >= 20) {
            if (currentRound >= 5) {
              declareWinner();
            } else {
              runElimination();
            }
          } else {
            setCurrentSpin(prev => prev + 1);
            setPhase("betting");
            setTimeRemaining(30);
          }
        }, 5000);
      }, 3000);
    } catch (error) {
      console.error('Error submitting bets:', error);
      setPhase("betting");
      alert('Spin failed. Please try again.');
    }
  }, [id, roundId, currentSpin]);

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

  // Betting timer logic
  useEffect(() => {
    if (phase !== "betting" || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("locked");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeRemaining]);

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
    lastSpinResult,
    lastPlayerPayout,
    eliminatedPlayer,
    declareWinner,
    isLoading,
    error
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
