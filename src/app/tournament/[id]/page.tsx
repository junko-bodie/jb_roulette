'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '@/lib/tournament/useTournament';
import RouletteTable from '@/components/table/RouletteTable';
import ChipTray from '@/components/chips/ChipTray';
import ResultDisplay from '@/components/ui/ResultDisplay';
import type { PlacedBet } from '@/lib/bets';
import EliminationScreen from './components/EliminationScreen';
import WinnerScreen from './components/WinnerScreen';
import Scoreboard from '@/components/tournament/Scoreboard';
import Avatar from '@/components/ui/Avatar';
import SpinHistory from '@/components/ui/SpinHistory';
import { useGame } from '@/context/GameContext';
import Toast from '@/components/ui/Toast';
import { soundEngine } from '@/lib/audioEngine';
import styles from '../tournament.module.css';
import LiveBettingFeed from '@/components/tournament/LiveBettingFeed';

export default function TournamentPage() {
  const {
    tournament,
    currentRound,
    currentSpin,
    phase,
    timeRemaining,
    scores,
    submitBets,
    completeSpin,
    lastSpinResult,
    lastPlayerPayout,
    eliminatedPlayer,
    allSpinBets,
    botBets,
    lobbyTimeRemaining,
    syncMyBets,
    bets,
    setBets,
    totalBet,
    dismissResult,
    history,
    addEvent,
    wheelType,
    updateWheelType
  } = useTournament();
  const { userProfile } = useGame();

  const [fundError, setFundError] = useState<string | null>(null);

  const triggerFundError = useCallback(() => {
    soundEngine?.playDeniedSound();
    setFundError('Insufficient chips for this bet.');
    setTimeout(() => setFundError(null), 2500);
  }, []);

  const handleClearFundError = useCallback(() => setFundError(null), []);

  const handleDismissResult = useCallback(() => {
    setShowResult(false);
    dismissResult();
  }, [dismissResult]);

  const [isStarting, setIsStarting] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (tournament?.status === 'active' && !hasStartedRef.current) {
      // Only show "Match Found" animation if we're at the very beginning
      const isVeryStart = currentRound === 1 && currentSpin === 1;

      if (isVeryStart) {
        setIsStarting(true);
        // Automatically enter the tournament as fast as possible (~2.5s)
        const timer = setTimeout(() => {
          setIsStarting(false);
          hasStartedRef.current = true;
        }, 2500);
        return () => clearTimeout(timer);
      } else {
        setIsStarting(false);
        hasStartedRef.current = true;
      }
    }
  }, [tournament?.status, currentRound, currentSpin]);

  const [selectedChip, setSelectedChip] = useState(10);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [tournamentWheelSize, setTournamentWheelSize] = useState(420);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive wheel sizing (same logic as solo game page)
  useEffect(() => {
    const updateWheelSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      const isMobilePortrait =
        window.innerWidth <= 900 &&
        window.matchMedia('(orientation: portrait)').matches;
      const isLandscapeMobile =
        window.matchMedia('(orientation: landscape)').matches &&
        window.innerHeight <= 540 &&
        window.innerWidth <= 950;
      if (isMobilePortrait) {
        setTournamentWheelSize(Math.min(window.innerWidth * 0.72, 300));
      } else if (isLandscapeMobile) {
        setTournamentWheelSize(260);
      } else if (window.innerHeight < 600) {
        setTournamentWheelSize(320);
      } else if (window.innerHeight < 750) {
        setTournamentWheelSize(400);
      } else if (window.innerWidth < 1300 || window.innerHeight < 900) {
        setTournamentWheelSize(480);
      } else {
        setTournamentWheelSize(550);
      }
    };

    updateWheelSize();
    window.addEventListener('resize', updateWheelSize);
    return () => window.removeEventListener('resize', updateWheelSize);
  }, []);

  // Synchronize phase with ResultDisplay
  useEffect(() => {
    if (phase === "result") {
      setShowResult(true);
      // Auto-dismiss after 2 seconds to keep the game moving fast
      const timer = setTimeout(() => {
        handleDismissResult();
      }, 2000);
      return () => clearTimeout(timer);
    } else if (phase === "betting") {
      setShowResult(false);
    }
  }, [phase]);

  const player = useMemo(() => {
    if (!userProfile?.id || !tournament) return tournament?.players?.find(p => !p.is_bot);
    return tournament.players?.find(p => p.player_id.toString() === userProfile.id);
  }, [tournament, userProfile?.id]);

  const myColor = useMemo(() => {
    return scores.find(s => s.player_id.toString() === player?.player_id.toString())?.color || '#c9a44c';
  }, [scores, player]);

  const myChips = player?.current_chips || 0;

  const lastSubmittedSpinRef = useRef<number>(-1);

  // Navigation Guard: Warn before leaving an active tournament
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (tournament?.status === 'active' && phase !== 'completed') {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the tournament? You will be withdrawn.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tournament?.status, phase]);

  const handleLeaveTournament = useCallback(() => {
    if (tournament?.status === 'active' && phase !== 'completed') {
      const confirmed = window.confirm("Are you sure you want to leave the tournament? Your current progress will be lost.");
      if (!confirmed) return;
    }
    window.location.href = '/lobby';
  }, [tournament?.status, phase]);

  // Sync bets to server for other players to see
  useEffect(() => {
    if (phase !== "betting" || bets.size === 0) return;

    // Sync immediately on first bet
    syncMyBets(Array.from(bets.values()));

    const syncInterval = setInterval(() => {
      syncMyBets(Array.from(bets.values()));
    }, 1000); // 1s sync frequency for real-time visibility

    return () => clearInterval(syncInterval);
  }, [phase, bets, syncMyBets]);

  const displayBets = useMemo(() => {
    // Only use server-finalized bets if they are actually available
    if ((phase === "spinning" || phase === "result") && allSpinBets.length > 0) {
      const merged = new Map<string, PlacedBet>();
      allSpinBets.forEach((b: any) => {
        const existing = merged.get(b.betId);
        const scoreEntry = scores.find(s => s.player_id.toString() === b.player_id?.toString());
        const pColor = scoreEntry?.color;
        const pInitial = scoreEntry?.username?.[0] || '?';

        if (existing) {
          merged.set(b.betId, {
            betId: b.betId,
            amount: existing.amount + b.amount,
            chips: [...existing.chips, ...(b.chips || [b.amount])],
            customColor: existing.customColor || pColor,
            playerInitial: existing.playerInitial || pInitial
          });
        } else {
          merged.set(b.betId, {
            betId: b.betId,
            amount: b.amount,
            chips: b.chips || [b.amount],
            customColor: pColor,
            playerInitial: pInitial
          });
        }
      });
      return merged;
    }

    // Local bets always have my color
    const merged = new Map<string, PlacedBet>();
    bets.forEach((b, id) => {
      merged.set(id, { ...b, customColor: myColor, playerInitial: userProfile.name?.[0] || 'Y' });
    });

    // Add bot bets from context
    if (botBets && Array.isArray(botBets)) {
      botBets.forEach((b: any) => {
        const existing = merged.get(b.betId);
        const scoreEntry = scores.find(s => s.player_id.toString() === b.player_id.toString());
        const botColor = scoreEntry?.color;
        const botInitial = scoreEntry?.username?.[0] || 'B';

        if (existing) {
          merged.set(b.betId, {
            betId: b.betId,
            amount: existing.amount + b.amount,
            chips: [...existing.chips, ...(b.chips || [b.amount])],
            // Keep my color/initial as priority
            customColor: existing.customColor || botColor,
            playerInitial: existing.playerInitial || botInitial
          });
        } else {
          merged.set(b.betId, {
            betId: b.betId,
            amount: b.amount,
            chips: b.chips || [b.amount],
            customColor: botColor,
            playerInitial: botInitial
          });
        }
      });
    }

    // Include other real players' pending bets
    tournament?.players?.forEach(p => {
      const isMe = userProfile?.id
        ? p.player_id?.toString() === userProfile.id
        : (p.username === userProfile.name && !p.is_bot);

      if (!isMe && p.pending_bets) {
        const scoreEntry = scores.find(s => s.player_id.toString() === p.player_id.toString());
        const pColor = scoreEntry?.color;
        const pInitial = scoreEntry?.username?.[0] || 'P';

        p.pending_bets.forEach((b: any) => {
          const existing = merged.get(b.betId);
          if (existing) {
            merged.set(b.betId, {
              betId: b.betId,
              amount: existing.amount + b.amount,
              chips: [...existing.chips, ...(b.chips || [b.amount])],
              customColor: existing.customColor || pColor,
              playerInitial: existing.playerInitial || pInitial
            });
          } else {
            merged.set(b.betId, {
              betId: b.betId,
              amount: b.amount,
              chips: b.chips || [b.amount],
              customColor: pColor,
              playerInitial: pInitial
            });
          }
        });
      }
    });

    return merged;
  }, [phase, allSpinBets, bets, botBets, tournament?.players, userProfile?.id, userProfile.name, scores, myColor]);

  const [betPlacementHistory, setBetPlacementHistory] = useState<{ betId: string; amount: number }[]>([]);
  const [lastSpinBets, setLastSpinBets] = useState<Map<string, PlacedBet>>(new Map());

  const lastTotal = useMemo(() =>
    Array.from(lastSpinBets.values()).reduce((sum, b) => sum + b.amount, 0),
    [lastSpinBets]
  );


  const handlePlaceBet = useCallback((betId: string) => {
    if (phase !== "betting") return;

    if (deleteMode) {
      setBets(prev => {
        const newBets = new Map(prev);
        newBets.delete(betId);
        return newBets;
      });
      return;
    }

    if (myChips < totalBet + selectedChip) {
      triggerFundError();
      return;
    }

    setBets(prev => {
      const newBets = new Map(prev);
      const currentBetObj = newBets.get(betId);
      const currentAmount = currentBetObj ? currentBetObj.amount : 0;
      const currentChips = currentBetObj ? currentBetObj.chips : [];

      newBets.set(betId, {
        betId,
        amount: currentAmount + selectedChip,
        chips: [...currentChips, selectedChip],
        customColor: myColor
      });
      return newBets;
    });

    // Add to betting feed
    addEvent({
      username: player?.username || userProfile.name,
      amount: selectedChip,
      betId: betId,
      betZone: betId,
      color: myColor
    });

    // Track history for "Clear Last Bet"
    setBetPlacementHistory(prevHistory => [...prevHistory, { betId, amount: selectedChip }]);
  }, [phase, deleteMode, myChips, totalBet, selectedChip, setBets]);

  const handleRemoveBet = useCallback((betId: string) => {
    soundEngine?.playSwoosh();
    setBets(prev => {
      const newBets = new Map(prev);
      newBets.delete(betId);
      return newBets;
    });
  }, [setBets]);

  const handleClearBets = useCallback(() => {
    soundEngine?.playSwoosh();
    setBets(new Map());
    setBetPlacementHistory([]);
  }, [setBets]);

  const handleClearLastBet = useCallback(() => {
    if (phase !== 'betting' || betPlacementHistory.length === 0) return;

    const nextHistory = [...betPlacementHistory];
    const lastAction = nextHistory.pop();
    if (!lastAction) return;

    // Update history state independently
    soundEngine?.playSwoosh();
    setBetPlacementHistory(nextHistory);

    // Update bets state based on the popped action
    setBets(currentBets => {
      const nextBets = new Map(currentBets);
      const existing = nextBets.get(lastAction.betId);
      if (!existing) return currentBets;

      const chips = [...existing.chips];
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
  }, [phase, betPlacementHistory, setBets]);

  const handleDoubleAllBets = useCallback(() => {
    if (phase !== "betting" || bets.size === 0) return false;

    if (myChips < totalBet * 2) {
      triggerFundError();
      return false;
    }

    setBets(prev => {
      const newBets = new Map(prev);
      newBets.forEach((bet, id) => {
        newBets.set(id, {
          ...bet,
          amount: bet.amount * 2,
          chips: [...bet.chips, ...bet.chips]
        });
      });
      return newBets;
    });

    // Also double the amounts in history so clearLastBet stays in sync
    setBetPlacementHistory(prev =>
      prev.map(entry => ({ ...entry, amount: entry.amount * 2 }))
    );

    soundEngine?.play2XClick();

    return true;
  }, [phase, bets, myChips, totalBet, setBets]);

  const handleRebet = useCallback(() => {
    if (phase !== 'betting' || lastSpinBets.size === 0) return;

    // Check if we have enough balance
    const lastTotal = Array.from(lastSpinBets.values()).reduce((sum, b) => sum + b.amount, 0);
    if (myChips < lastTotal) return;

    const clonedBets = new Map(Array.from(lastSpinBets.entries()).map(([betId, bet]) => [
      betId,
      { ...bet, chips: [...bet.chips] }
    ]));

    setBets(clonedBets);
    soundEngine?.playRebetSound();

    // Reconstruct history roughly for clearLast
    const newHistory: { betId: string; amount: number }[] = [];
    clonedBets.forEach((bet, id) => {
      bet.chips.forEach(c => newHistory.push({ betId: id, amount: c }));
    });
    setBetPlacementHistory(newHistory);
  }, [phase, lastSpinBets, myChips, setBets]);

  const handlePopLastChip = useCallback((betId: string) => {
    setBets(prev => {
      const newBets = new Map(prev);
      const bet = newBets.get(betId);
      if (!bet || bet.chips.length === 0) return prev;

      const newChips = [...bet.chips];
      newChips.pop();

      if (newChips.length === 0) {
        newBets.delete(betId);
      } else {
        newBets.set(betId, {
          ...bet,
          chips: newChips,
          amount: newChips.reduce((a, b) => a + b, 0)
        });
      }
      soundEngine?.playSwoosh();
      return newBets;
    });
  }, [setBets]);

  const handleClearZone = useCallback((betId: string) => {
    soundEngine?.playSwoosh();
    setBets(prev => {
      const newBets = new Map(prev);
      newBets.delete(betId);
      return newBets;
    });
  }, [setBets]);

  // Update lastSpinBets when transition to spinning
  useEffect(() => {
    if (phase === 'spinning' && bets.size > 0) {
      const clonedBets = new Map(Array.from(bets.entries()).map(([betId, bet]) => [
        betId,
        { ...bet, chips: [...bet.chips] }
      ]));
      setLastSpinBets(clonedBets);
    }
  }, [phase, bets]);

  const handleSubmitBets = useCallback(() => {
    submitBets(Array.from(bets.values()));
  }, [submitBets, bets]);

  if (!tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050d0a',
      }}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          style={{ color: '#c9a44c', letterSpacing: '0.3em', fontWeight: 800, textTransform: 'uppercase' }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          CONNECTING TO TOURNAMENT...
        </motion.span>
      </div>
    );
  }

  // If real player is eliminated or tournament finished, show winner/summary
  if (phase === "completed" || (player?.status === "eliminated" && phase !== "elimination")) {
    if (player) {
      const summaryPlayer = {
        username: player.username,
        is_bot: player.is_bot,
        final_chips: player.current_chips,
        final_position: player.final_position || 1,
        eliminated_round: player.eliminated_round || 5
      };
      return <WinnerScreen tournament={tournament} player={summaryPlayer} />;
    }
  }

  const displayTime = Math.min(30, timeRemaining);
  const isUrgent = phase === 'betting' && displayTime > 0 && displayTime <= 5;

  // ════════════ MATCHMAKING LOBBY OVERLAY ════════════
  if (tournament.status === 'waiting') {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Background Accents */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.05)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.03)', borderRadius: '50%', filter: 'blur(80px)' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            zIndex: 10,
            width: '94%',
            maxWidth: '640px',
            background: 'linear-gradient(135deg, rgba(20, 50, 40, 0.95) 0%, rgba(10, 30, 20, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(201, 164, 76, 0.35)',
            borderRadius: '24px',
            padding: 'clamp(20px, 5vw, 48px) clamp(16px, 4vw, 40px)',
            boxShadow: '0 30px 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(201, 164, 76, 0.05)',
            textAlign: 'center' as const,
            position: 'relative' as const,
            overflow: 'hidden'
          }}
        >
          {/* Subtle inner glow */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,164,76,0.3), transparent)' }} />

          <div style={{ color: '#c9a44c', fontWeight: 900, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase', marginBottom: '16px', opacity: 0.8 }}>
            Tournament Matchmaking
          </div>
          <h2 className={styles.shimmerText} style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Searching for Players...
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px', fontWeight: 500 }}>
            Match begins automatically in <span style={{ color: '#c9a44c', fontWeight: 800 }}>{lobbyTimeRemaining}s</span>
          </p>

          {/* Players Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(8px, 2vw, 20px)',
            marginBottom: 'clamp(24px, 4vw, 48px)'
          }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const p = tournament.players[i];
              return (
                <div key={i} style={{
                  background: p ? 'rgba(201,164,76,0.08)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${p ? 'rgba(201,164,76,0.4)' : 'rgba(201,164,76,0.1)'}`,
                  borderRadius: '20px',
                  padding: '20px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: p ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar type={p?.avatar_url || 'default'} size="md" />
                    {p && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', border: '2px solid #0a1e14' }} />}
                  </div>
                  <span style={{
                    color: p ? '#fff' : 'rgba(255,255,255,0.15)',
                    fontSize: '11px',
                    fontWeight: 800,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {p ? p.username : 'EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(0,0,0,0.2)',
            padding: '12px 24px',
            borderRadius: '100px',
            width: 'fit-content',
            margin: '0 auto',
            border: '1px solid rgba(201,164,76,0.1)'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(201,164,76,0.1)',
                borderTopColor: '#c9a44c',
                borderRadius: '50%'
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Matched <span style={{ color: '#c9a44c' }}>{tournament.players.length}/6</span> Players
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════ MATCH FOUND OVERLAY ════════════
  if (isStarting && tournament) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(circle at center, #1a4d3c 0%, #050d0a 100%)' }}>

        {/* Animated Background Rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-100%] opacity-20"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #c9a44c 20deg, transparent 40deg, #c9a44c 60deg, transparent 80deg)',
            filter: 'blur(60px)'
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative z-10 flex flex-col items-center text-center px-4"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-[#c9a44c] font-black text-xs uppercase tracking-[0.5em] mb-4"
          >
            Matchmaking Complete
          </motion.div>

          <motion.h1
            initial={{ scale: 0.8, filter: 'blur(10px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="text-white font-black text-5xl md:text-7xl italic uppercase tracking-tighter mb-8"
            style={{ textShadow: '0 0 50px rgba(201,164,76,0.6), 0 10px 20px rgba(0,0,0,0.5)' }}
          >
            Match Found!
          </motion.h1>

          {/* Competitors List */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {tournament?.players?.slice(0, 6).map((p, i) => (
              <motion.div
                key={p.player_id.toString()}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4 + (i * 0.08), duration: 0.3 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <Avatar type={p.avatar_url || 'default'} size="lg" className="border-4 border-[#c9a44c]/60 shadow-2xl" />
                  {p.player_id.toString() === userProfile?.id && (
                    <div className="absolute -top-2 -right-2 bg-[#c9a44c] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                      You
                    </div>
                  )}
                </div>
                <span className="text-white font-bold text-sm tracking-wide">
                  {p.username}
                </span>
                <span className="text-[#c9a44c] text-[10px] font-black uppercase tracking-widest">
                  ${p.current_chips.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Starting Info - High Speed Transition */}
          <div className="relative h-20 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="h-px w-64 bg-gradient-to-r from-transparent via-[#c9a44c]/40 to-transparent" />
              <span className="text-white/60 font-black text-[10px] uppercase tracking-[0.3em]">
                Round {currentRound} Starting
              </span>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-[#c9a44c] font-bold text-xs uppercase tracking-widest"
              >
                Are You Ready?
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen h-[100dvh] w-full overflow-y-auto md:overflow-hidden select-none mobile-root-scroll"
      style={{ background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)` }}
    >

      {/* ═══ TOP HEADER — TOURNAMENT INFO + TIMER ═══ */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-3 sm:px-6 py-2 z-10 gap-2 tournament-header-mobile"
        style={{
          background: 'linear-gradient(to bottom, #3b2518, #1c100a)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          minHeight: '48px',
        }}
      >
        <div className="flex items-center min-w-0">
          <button
            onClick={handleLeaveTournament}
            className="text-[#c9a44c] hover:text-white transition-colors mr-4 sm:mr-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="hidden lg:block min-w-0">
            <SpinHistory history={history} />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-8 flex-shrink-0">
          {/* Round Information */}
          <div className="flex flex-col items-end">
            <h1 className="text-[#c9a44c] font-black text-xs sm:text-lg tracking-widest uppercase leading-none">
              <span className="hidden sm:inline">Round {currentRound} of 5</span>
            </h1>
            <div className="text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-0.5 sm:mt-1">
              Spin {currentSpin}/5
            </div>
          </div>

          {/* Timer Section */}
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 
              ${isUrgent ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'border-[#c9a44c] bg-black/60 shadow-xl'}
              transition-all duration-300
            `}>
              <span className={`text-lg font-black tabular-nums ${isUrgent ? 'text-red-500' : 'text-[#c9a44c]'}`}>
                {phase === 'betting' ? displayTime : '--'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                {phase === 'betting' ? 'BETS OPEN' : phase.toUpperCase()}
              </span>
              {isUrgent && <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter mt-0.5">Closing soon!</span>}
            </div>
          </div>

          {/* Player Profile Section */}
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[12px] font-black text-white">{userProfile.name}</span>
              <span className="text-[9px] text-[#c9a44c] uppercase font-bold tracking-tighter">Tournament Mode</span>
            </div>
            <Avatar type={userProfile.avatar} size="sm" className="border-2 border-[#c9a44c]/40" />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative px-1 sm:px-2 py-0 overflow-y-auto md:overflow-hidden flex flex-col lg:flex-row items-stretch justify-between gap-2 sm:gap-4 tournament-main-mobile h-full">


        {/* Roulette Table — takes most of the space */}
        <div className="flex-1 min-w-0 max-w-[1200px] flex flex-col justify-center items-center">
          <RouletteTable
            wheelType={wheelType}
            currentResult={lastSpinResult}
            isSpinning={phase === "spinning"}
            onSpinComplete={completeSpin}
            wheelSize={phase === "spinning" ? Math.min(tournamentWheelSize * 1.35, 580) : tournamentWheelSize}
            wheelRef={{ current: null }}
            bets={displayBets}
            myBets={bets}
            onPlaceBet={handlePlaceBet}
            onRemoveBet={handleRemoveBet}
            isBettingDisabled={phase !== "betting"}
            lastPayout={lastPlayerPayout}
            phase={
              phase === "betting" ? "BETTING" :
                phase === "spinning" ? "SPINNING" :
                  phase === "locked" ? "LOCKED" :
                    "RESULT"
            }
            setWheelType={(type) => updateWheelType(type)}
            onSpin={() => { }}
            onRebet={handleRebet}
            onClearBets={handleClearBets}
            onClearLastBet={handleClearLastBet}
            hasLastSpin={lastSpinBets.size > 0}
            balance={myChips}
            totalBet={totalBet}
            onDoubleAllBets={handleDoubleAllBets}
            deleteMode={deleteMode}
            onPopLastChip={handlePopLastChip}
            onClearZone={handleClearZone}
            onTimeout={() => { }}
            tournamentMode={true}
          />
        </div>

        {/* Scoreboard & Betting Feed — Desktop sidebar */}
        <motion.div
          animate={{
            width: phase === "spinning" ? 0 : 320,
            opacity: phase === "spinning" ? 0 : 1,
            x: phase === "spinning" ? 100 : 0
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-shrink-0 flex-col gap-4 py-6 h-full overflow-hidden"
        >
          <div className="flex-[1.21] flex flex-col min-h-0">
            <Scoreboard />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <LiveBettingFeed />
          </div>
        </motion.div>

        {/* Scoreboard & Live Feed — Mobile inline (below table) */}
        <div className="flex lg:hidden flex-col gap-2 px-1 pb-2 flex-shrink-0">
          {/* Compact horizontal scoreboard */}
          <div className="bg-black/50 rounded-xl border border-white/10 backdrop-blur-md px-3 py-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[8px] font-black text-[#c9a44c] uppercase tracking-[0.3em]">Rankings</span>
              <div className="flex-1 h-px bg-[#c9a44c]/20" />
            </div>
            {/* Players List */}
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar divide-y divide-white/[0.04]">
              {scores.filter(s => s.status === 'active').map((s) => {
                const isMe = !s.is_bot;
                return (
                  <div
                    key={s.player_id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0 border ${isMe
                      ? 'bg-[#c9a44c]/20 border-[#c9a44c]/40'
                      : 'bg-white/5 border-white/5'
                      }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: s.color }}
                    >
                      {s.rank}
                    </div>
                    <span className={`text-[10px] font-bold truncate max-w-[60px] ${isMe ? 'text-[#c9a44c]' : 'text-white/70'}`}>
                      {s.username}
                    </span>
                    <span className="text-[10px] font-black text-white/50 tabular-nums">
                      ${s.chips >= 1000 ? `${(s.chips / 1000).toFixed(1)}k` : s.chips}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact live feed — last 3 events */}
          {phase === 'betting' && (
            <div className="bg-black/40 rounded-xl border border-white/5 backdrop-blur-md px-3 py-1.5 max-h-[80px] overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Live Bets</span>
              </div>
              <LiveBettingFeed />
            </div>
          )}
        </div>
      </main>

      {/* ═══ FOOTER — CHIP TRAY LEFT, BUTTONS RIGHT ═══ */}
      <footer
        className="flex-shrink-0 w-full z-10 tournament-footer-mobile"
        style={{
          background: 'linear-gradient(to top, #0a0603 0%, #160e07 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.25)',
          boxShadow: '0 -16px 60px rgba(0,0,0,0.95)',
          padding: '10px 32px',
        }}
      >
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">

          {/* Left: Chip Tray */}
          <div className="flex-shrink-0 order-1">
            <div className="max-w-full overflow-x-auto no-scrollbar">
              <ChipTray
                selectedChip={selectedChip}
                onSelectChip={setSelectedChip}
                balance={myChips}
                totalBet={totalBet}
                disabled={phase !== "betting"}
              />
            </div>
          </div>

          {/* Right: Betting Controls & Financials */}
          <div className="flex items-center gap-3 order-2 tournament-controls-mobile" style={{ paddingRight: '8px' }}>

            {/* Total Bet */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 18px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(201,164,76,0.15)',
                borderRadius: '8px',
                minWidth: '90px',
              }}
            >
              <span style={{ fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,164,76,0.45)', fontWeight: 700, marginBottom: '3px' }}>Total Bet</span>
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>${totalBet.toLocaleString()}</span>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

            {/* Action buttons row — all same height and visual weight */}
            <div className="flex items-center gap-1.5">

              {/* REBET */}
              <motion.button
                onClick={handleRebet}
                disabled={phase !== "betting" || lastSpinBets.size === 0 || myChips < lastTotal}
                whileTap={{ scale: 0.94 }}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  ...((phase !== "betting" || lastSpinBets.size === 0 || myChips < lastTotal) ? {
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.15)',
                    cursor: 'default',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                  }),
                }}
              >
                Rebet
              </motion.button>

              {/* UNDO */}
              <motion.button
                onClick={handleClearLastBet}
                disabled={phase !== "betting" || betPlacementHistory.length === 0}
                whileTap={{ scale: 0.94 }}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  ...((phase !== "betting" || betPlacementHistory.length === 0) ? {
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.15)',
                    cursor: 'default',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                  }),
                }}
              >
                Undo
              </motion.button>

              {/* CLEAR */}
              <motion.button
                onClick={handleClearBets}
                disabled={phase !== "betting" || bets.size === 0}
                whileTap={{ scale: 0.94 }}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  ...((phase !== "betting" || bets.size === 0) ? {
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.15)',
                    cursor: 'default',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                  }),
                }}
              >
                Clear
              </motion.button>

              {/* 2× */}
              <motion.button
                onClick={handleDoubleAllBets}
                disabled={phase !== "betting" || myChips < totalBet * 2 || totalBet === 0}
                whileTap={{ scale: 0.94 }}
                style={{
                  height: '36px',
                  width: '44px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...((phase !== "betting" || myChips < totalBet * 2 || totalBet === 0) ? {
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.15)',
                    cursor: 'default',
                  } : {
                    background: 'rgba(201,164,76,0.08)',
                    borderColor: 'rgba(201,164,76,0.3)',
                    color: '#c9a44c',
                    cursor: 'pointer',
                  }),
                }}
              >
                2×
              </motion.button>

              {/* ✕ delete mode */}
              <motion.button
                onClick={() => { soundEngine?.playSwoosh(); setDeleteMode(!deleteMode); }}
                disabled={phase !== "betting"}
                whileTap={{ scale: 0.94 }}
                style={{
                  height: '36px',
                  width: '44px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(phase !== "betting" ? {
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.15)',
                    cursor: 'default',
                  } : deleteMode ? {
                    background: 'rgba(220,38,38,0.15)',
                    borderColor: 'rgba(248,113,113,0.35)',
                    color: '#f87171',
                    cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(220,38,38,0.18)',
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.09)',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                  }),
                }}
              >
                ✕
              </motion.button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

            {/* Balance */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 18px',
                background: 'rgba(201,164,76,0.05)',
                border: '1px solid rgba(201,164,76,0.18)',
                borderRadius: '8px',
                minWidth: '100px',
              }}
            >
              <span style={{ fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,164,76,0.55)', fontWeight: 700, marginBottom: '3px' }}>Balance</span>
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>${myChips.toLocaleString()}</span>
            </div>

            {/* Place Bet — primary CTA */}
            <div className="relative" style={{ marginRight: '8px' }}>
              <motion.button
                onClick={handleSubmitBets}
                disabled={phase !== "betting"}
                whileHover={phase === 'betting' && bets.size > 0 ? { scale: 1.02 } : {}}
                whileTap={phase === 'betting' && bets.size > 0 ? { scale: 0.97 } : {}}
                className="tournament-submit-btn"
                style={{
                  height: '40px',
                  padding: '0 28px',
                  borderRadius: '9px',
                  fontFamily: "'Bodoni Moda', serif",
                  fontStyle: 'italic',
                  fontSize: '13px',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  position: 'relative',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                  ...(phase === 'betting'
                    ? (bets.size > 0 ? {
                      background: 'linear-gradient(150deg, #d4ab52 0%, #c9a44c 60%, #b08a38 100%)',
                      borderColor: 'rgba(255,220,120,0.25)',
                      color: '#1a0d00',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(201,164,76,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                    } : {
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.12)',
                      cursor: 'default',
                    })
                    : {
                      background: 'rgba(0,0,0,0.35)',
                      borderColor: 'rgba(201,164,76,0.12)',
                      color: 'rgba(201,164,76,0.35)',
                      cursor: 'default',
                    }),
                }}
              >
                {phase === "betting" ? "Place Bet" : "Placed"}
              </motion.button>
              {phase === 'betting' && bets.size > 0 && (
                <div style={{ position: 'absolute', inset: 0, background: '#c9a44c', filter: 'blur(18px)', opacity: 0.16, zIndex: 0, borderRadius: '9px' }} />
              )}
            </div>

          </div>
        </div>
      </footer>

      <ResultDisplay
        visible={showResult}
        onDismiss={handleDismissResult}
        result={lastSpinResult}
        payout={lastPlayerPayout}
      />

      <Toast
        message={fundError || ''}
        isVisible={!!fundError}
        onClose={handleClearFundError}
        type="error"
        duration={2500}
      />

      <EliminationScreen
        player={eliminatedPlayer}
        visible={phase === "elimination" && currentRound < 5}
      />
    </div>
  );
}
