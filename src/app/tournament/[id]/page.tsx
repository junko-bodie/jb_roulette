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

/* ─────────────────────────────────────────────
   Portrait-lock overlay
   Shows whenever a mobile device is in portrait
───────────────────────────────────────────── */
function PortraitLockOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at 40% 60%, #0d2a20 0%, #050d0a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      {/* Animated phone-rotate icon */}
      <motion.div
        animate={{ rotate: [0, -90, -90, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.35, 0.65, 1] }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Phone body */}
          <rect x="20" y="8" width="32" height="56" rx="6" stroke="#c9a44c" strokeWidth="3" fill="none" />
          {/* Home button dot */}
          <circle cx="36" cy="57" r="3" fill="#c9a44c" opacity="0.6" />
          {/* Screen */}
          <rect x="24" y="16" width="24" height="34" rx="2" fill="rgba(201,164,76,0.08)" stroke="rgba(201,164,76,0.2)" strokeWidth="1" />
          {/* Rotate arrow */}
          <path
            d="M54 18 C62 26, 62 46, 54 54"
            stroke="#4ade80"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="4 3"
          />
          <path d="M51 51 L55 55 L59 51" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '280px' }}>
        <div style={{
          color: '#c9a44c',
          fontWeight: 900,
          fontSize: '10px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>
          Rotate Your Device
        </div>
        <h2 style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: '22px',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          margin: 0,
        }}>
          Landscape Mode Required
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '13px',
          fontWeight: 500,
          lineHeight: 1.5,
          margin: 0,
        }}>
          The roulette tournament is optimised for landscape view. Please rotate your phone sideways to play.
        </p>
      </div>

      {/* Pulsing landscape hint */}
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: '100px',
          padding: '8px 18px',
        }}
      >
        {/* Landscape phone icon */}
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <rect x="1" y="1" width="20" height="12" rx="3" stroke="#4ade80" strokeWidth="1.5" fill="none" />
          <rect x="3" y="3" width="14" height="8" rx="1" fill="rgba(74,222,128,0.15)" />
          <circle cx="19" cy="7" r="1.5" fill="#4ade80" opacity="0.6" />
        </svg>
        <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Landscape
        </span>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hook: detects portrait on a touch device
───────────────────────────────────────────── */
function useIsPortraitMobile() {
  const getState = () => {
    if (typeof window === 'undefined') return false;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return false;
    // true when height > width (portrait)
    return window.innerHeight > window.innerWidth;
  };

  const [isPortrait, setIsPortrait] = useState(getState);

  useEffect(() => {
    const handler = () => setIsPortrait(getState());
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return isPortrait;
}

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
    events,
    wheelType,
    updateWheelType
  } = useTournament();
  const { userProfile } = useGame();

  // Portrait-lock
  const isPortraitMobile = useIsPortraitMobile();

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
      const isVeryStart = currentRound === 1 && currentSpin === 1;
      if (isVeryStart) {
        setIsStarting(true);
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

  useEffect(() => {
    const updateWheelSize = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = isTouchDevice && window.innerWidth <= 1024;
      setIsMobile(mobile);

      const isLandscapeMobile =
        window.matchMedia('(orientation: landscape)').matches &&
        window.innerHeight <= 600 &&
        window.innerWidth <= 1024;

      if (isLandscapeMobile) {
        const SIDEBAR_W = 108;
        const FOOTER_H = 60;
        const HEADER_H = 38;
        const availableH = window.innerHeight - HEADER_H - FOOTER_H;
        const tableColW = window.innerWidth - SIDEBAR_W;

        setTournamentWheelSize(Math.min(
          availableH * 0.90,
          tableColW * 0.32,
          260
        ));
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
    window.addEventListener('orientationchange', updateWheelSize);
    return () => {
      window.removeEventListener('resize', updateWheelSize);
      window.removeEventListener('orientationchange', updateWheelSize);
    };
  }, []);

  useEffect(() => {
    if (phase === "result") {
      setShowResult(true);
      const timer = setTimeout(() => {
        handleDismissResult();
      }, 3500);
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

  useEffect(() => {
    if (phase !== "betting" || bets.size === 0) return;
    syncMyBets(Array.from(bets.values()));
    const syncInterval = setInterval(() => {
      syncMyBets(Array.from(bets.values()));
    }, 1000);
    return () => clearInterval(syncInterval);
  }, [phase, bets, syncMyBets]);

  const displayBets = useMemo(() => {
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

    const merged = new Map<string, PlacedBet>();
    bets.forEach((b, id) => {
      merged.set(id, { ...b, customColor: myColor, playerInitial: userProfile.name?.[0] || 'Y' });
    });

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
    addEvent({
      username: player?.username || userProfile.name,
      amount: selectedChip,
      betId: betId,
      betZone: betId,
      color: myColor
    });
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
    soundEngine?.playSwoosh();
    setBetPlacementHistory(nextHistory);
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
    setBetPlacementHistory(prev =>
      prev.map(entry => ({ ...entry, amount: entry.amount * 2 }))
    );
    soundEngine?.play2XClick();
    return true;
  }, [phase, bets, myChips, totalBet, setBets]);

  const handleRebet = useCallback(() => {
    if (phase !== 'betting' || lastSpinBets.size === 0) return;
    const lastTotal = Array.from(lastSpinBets.values()).reduce((sum, b) => sum + b.amount, 0);
    if (myChips < lastTotal) return;
    const clonedBets = new Map(Array.from(lastSpinBets.entries()).map(([betId, bet]) => [
      betId,
      { ...bet, chips: [...bet.chips] }
    ]));
    setBets(clonedBets);
    soundEngine?.playRebetSound();
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

  // ── Portrait lock: render overlay on top of everything ──
  if (isPortraitMobile) {
    return <PortraitLockOverlay />;
  }

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
        padding: '16px',
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.05)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.03)', borderRadius: '50%', filter: 'blur(80px)' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            zIndex: 10,
            width: '100%',
            maxWidth: '640px',
            background: 'linear-gradient(135deg, rgba(20, 50, 40, 0.95) 0%, rgba(10, 30, 20, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(201, 164, 76, 0.35)',
            borderRadius: '24px',
            padding: 'clamp(16px, 5vw, 48px) clamp(12px, 4vw, 40px)',
            boxShadow: '0 30px 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(201, 164, 76, 0.05)',
            textAlign: 'center' as const,
            position: 'relative' as const,
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,164,76,0.3), transparent)' }} />

          <div style={{ color: '#c9a44c', fontWeight: 900, letterSpacing: '0.4em', fontSize: '10px', textTransform: 'uppercase', marginBottom: '16px', opacity: 0.8 }}>
            Tournament Matchmaking
          </div>
          <h2 className={styles.shimmerText} style={{ fontSize: 'clamp(24px, 7vw, 36px)', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Searching for Players...
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: 'clamp(24px, 5vw, 40px)', fontWeight: 500 }}>
            Match begins automatically in <span style={{ color: '#c9a44c', fontWeight: 800 }}>{lobbyTimeRemaining}s</span>
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(6px, 2vw, 20px)',
            marginBottom: 'clamp(20px, 4vw, 48px)'
          }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const p = tournament.players[i];
              return (
                <div key={i} style={{
                  background: p ? 'rgba(201,164,76,0.08)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${p ? 'rgba(201,164,76,0.4)' : 'rgba(201,164,76,0.1)'}`,
                  borderRadius: '16px',
                  padding: 'clamp(12px, 3vw, 20px) clamp(8px, 2vw, 12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: p ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar type={p?.avatar_url || 'default'} size="md" />
                    {p && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', border: '2px solid #0a1e14' }} />}
                  </div>
                  <span style={{
                    color: p ? '#fff' : 'rgba(255,255,255,0.15)',
                    fontSize: 'clamp(9px, 2vw, 11px)',
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
            style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: 'clamp(32px, 10vw, 72px)',
              fontStyle: 'italic',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              marginBottom: '32px',
              textShadow: '0 0 50px rgba(201,164,76,0.6), 0 10px 20px rgba(0,0,0,0.5)'
            }}
          >
            Match Found!
          </motion.h1>

          <div className="flex flex-wrap justify-center gap-4 mb-10 px-2">
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
                <span className="text-white font-bold text-xs tracking-wide">
                  {p.username}
                </span>
                <span className="text-[#c9a44c] text-[10px] font-black uppercase tracking-widest">
                  ${p.current_chips.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>

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

  // ════════════ LANDSCAPE MOBILE layout detection ════════════
  // isMobile is true for touch devices ≤1024px wide
  // In landscape on mobile, innerWidth > innerHeight

  return (
    <div
      className="flex flex-col w-full select-none"
      style={{
        background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)`,
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* ═══ TOP HEADER ═══ */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          // Landscape mobile gets a slimmer header
          padding: isMobile ? '0 8px' : '0 16px 0 24px',
          background: 'linear-gradient(to bottom, #4a2f1f, #26170f)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.6)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          height: isMobile ? '38px' : '52px',
          minHeight: isMobile ? '38px' : '52px',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {/* Left: Back + Spin History */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: '6px' }}>
          <button
            onClick={handleLeaveTournament}
            style={{
              color: '#c9a44c',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div style={{
            overflow: 'hidden',
            maxWidth: isMobile ? '100px' : 'none',
          }}>
            <SpinHistory history={history} />
          </div>
        </div>

        {/* Right: Round info + Timer + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '24px', flexShrink: 0 }}>

          {/* Round Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {!isMobile && (
              <span style={{ color: '#c9a44c', fontWeight: 900, fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1 }}>
                Round {currentRound} of 5
              </span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '8px' : '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: isMobile ? 0 : '3px' }}>
              {isMobile ? `R${currentRound} S${currentSpin}/5` : `Spin ${currentSpin}/5`}
            </span>
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${isUrgent ? '#ef4444' : '#c9a44c'}`,
              background: isUrgent ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.6)',
              boxShadow: isUrgent ? '0 0 20px rgba(239,68,68,0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: isMobile ? '13px' : '18px',
                fontWeight: 900,
                color: isUrgent ? '#ef4444' : '#c9a44c',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {phase === 'betting' ? displayTime : '--'}
              </span>
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>
                  {phase === 'betting' ? 'OPEN' : phase.substring(0, 4).toUpperCase()}
                </span>
                {isUrgent && <span style={{ fontSize: '8px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', marginTop: '2px' }}>Soon!</span>}
              </div>
            )}
          </div>

          {/* Player Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{userProfile.name}</span>
                <span style={{ fontSize: '9px', color: '#c9a44c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Tournament</span>
              </div>
            )}
            <Avatar type={userProfile.avatar} size={isMobile ? 'sm' : 'sm'} className="border-2 border-[#c9a44c]/40" />
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          // On landscape mobile: always row layout — table left, sidebar right
          flexDirection: 'row',
          overflow: 'hidden',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: isMobile ? '0' : '8px',
          padding: isMobile ? '0' : '0 8px',
          position: 'relative',
        }}
      >
        {/* Roulette Table Container */}
        <div style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          ...(isMobile && { maxWidth: 'calc(100vw - 114px)', position: 'relative', padding: '0 2px' }),
        }}>
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

        {/* ─── Landscape Mobile Right Sidebar ─── */}
        {isMobile && (
          <div style={{
            flexShrink: 0,
            width: '108px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '4px 4px 4px 0',
            overflow: 'hidden',
          }}>
            {/* Compact rankings */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              padding: '6px 8px', /* Better padding */
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#c9a44c', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Rankings</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(201,164,76,0.2)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: 'calc(100% - 20px)' }} className="no-scrollbar">
                {scores.filter(s => s.status === 'active').map((s) => {
                  const isMe = !s.is_bot;
                  return (
                    <div
                      key={s.player_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 5px',
                        borderRadius: '6px',
                        background: isMe ? 'rgba(201,164,76,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isMe ? 'rgba(201,164,76,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 900,
                        color: '#fff',
                        background: s.color,
                        flexShrink: 0,
                      }}>
                        {s.rank}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: isMe ? '#c9a44c' : 'rgba(255,255,255,0.7)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {s.username}
                        </div>
                        <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                          ${s.chips >= 1000 ? `${(s.chips / 1000).toFixed(1)}k` : s.chips}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compact inline live feed — full LiveBettingFeed component is too large for sidebar */}
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(6px)',
              padding: '5px 6px',
              flexShrink: 0,
              maxHeight: '80px',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                <div style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: phase === 'betting' ? '#4ade80' : 'rgba(255,255,255,0.2)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '7px', fontWeight: 900, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  Live
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                {events.slice(0, 4).map((event) => (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '3px', minHeight: '14px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: event.color || '#c9a44c', flexShrink: 0 }} />
                    <span style={{ fontSize: '7px', fontWeight: 700, color: event.color || 'rgba(255,255,255,0.7)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.username}
                    </span>
                    <span style={{ fontSize: '7px', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                      ${event.amount >= 1000 ? `${(event.amount / 1000).toFixed(1)}k` : event.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <motion.div
            animate={{
              width: phase === "spinning" ? 0 : 320,
              opacity: phase === "spinning" ? 0 : 1,
              x: phase === "spinning" ? 100 : 0
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px 0',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div style={{ flex: '1.21 1 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Scoreboard />
            </div>
            <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <LiveBettingFeed />
            </div>
          </motion.div>
        )}
      </main>

      {/* ═══ FOOTER — CHIP TRAY + CONTROLS ═══ */}
      <footer
        style={{
          flexShrink: 0,
          width: '100%',
          zIndex: 10,
          background: 'linear-gradient(to top, #0a0603 0%, #160e07 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.25)',
          boxShadow: '0 -16px 60px rgba(0,0,0,0.95)',
          padding: isMobile ? '6px 12px' : '10px 16px', /* Better padding */
        }}
      >
        {isMobile ? (
          /* ─── LANDSCAPE MOBILE FOOTER: single row, compact ─── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* Chip Tray — scrollable, takes available space */}
            <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="no-scrollbar">
              <ChipTray
                selectedChip={selectedChip}
                onSelectChip={setSelectedChip}
                balance={myChips}
                totalBet={totalBet}
                disabled={phase !== "betting"}
              />
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

            {/* Balance pill */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px 10px',
              background: 'rgba(201,164,76,0.1)',
              border: '1px solid rgba(201,164,76,0.3)',
              borderRadius: '8px',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a44c', fontWeight: 900 }}>Bal</span>
              <span style={{ fontSize: '14px', fontWeight: 950, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                ${myChips >= 1000 ? `${(myChips / 1000).toFixed(1)}k` : myChips}
              </span>
            </div>

            {/* Bet pill */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px 10px',
              background: 'rgba(201,164,76,0.07)',
              border: '1px solid rgba(201,164,76,0.2)',
              borderRadius: '8px',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a44c', fontWeight: 900 }}>Bet</span>
              <span style={{ fontSize: '14px', fontWeight: 950, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                ${totalBet >= 1000 ? `${(totalBet / 1000).toFixed(1)}k` : totalBet}
              </span>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

            {/* Action buttons row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <LandscapeMobileBtn label="Re" onClick={handleRebet} disabled={phase !== "betting" || lastSpinBets.size === 0 || myChips < lastTotal} title="Rebet" />
              <LandscapeMobileBtn label="↩" onClick={handleClearLastBet} disabled={phase !== "betting" || betPlacementHistory.length === 0} title="Undo" />
              <LandscapeMobileBtn label="CLR" onClick={handleClearBets} disabled={phase !== "betting" || bets.size === 0} title="Clear" />
              <LandscapeMobileBtn label="2×" onClick={handleDoubleAllBets} disabled={phase !== "betting" || myChips < totalBet * 2 || totalBet === 0} accent title="Double" />
              {/* Delete mode toggle */}
              <motion.button
                onClick={() => { soundEngine?.playSwoosh(); setDeleteMode(!deleteMode); }}
                disabled={phase !== "betting"}
                whileTap={{ scale: 0.92 }}
                title="Delete mode"
                style={{
                  width: '32px', /* increased size */
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  ...(phase !== "betting" ? {
                    background: 'transparent',
                    borderColor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.12)',
                    cursor: 'default',
                  } : deleteMode ? {
                    background: 'rgba(220,38,38,0.15)',
                    borderColor: 'rgba(248,113,113,0.35)',
                    color: '#f87171',
                    cursor: 'pointer',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                  }),
                }}
              >
                ✕
              </motion.button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

            {/* Place Bet CTA */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <motion.button
                onClick={handleSubmitBets}
                disabled={phase !== "betting"}
                whileTap={phase === 'betting' && bets.size > 0 ? { scale: 0.96 } : {}}
                style={{
                  height: '38px', /* Taller button for better tap target */
                  padding: '0 16px',
                  borderRadius: '8px',
                  fontFamily: "'Georgia', serif",
                  fontStyle: 'italic',
                  fontSize: '12px', /* slightly larger font */
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  border: '1px solid',
                  cursor: phase === 'betting' ? 'pointer' : 'default',
                  position: 'relative',
                  zIndex: 1,
                  whiteSpace: 'nowrap',
                  ...(phase === 'betting'
                    ? (bets.size > 0 ? {
                      background: 'linear-gradient(150deg, #d4ab52 0%, #c9a44c 60%, #b08a38 100%)',
                      borderColor: 'rgba(255,220,120,0.25)',
                      color: '#1a0d00',
                      boxShadow: '0 4px 16px rgba(201,164,76,0.3)',
                    } : {
                      background: 'transparent',
                      borderColor: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.12)',
                    })
                    : {
                      background: 'rgba(0,0,0,0.35)',
                      borderColor: 'rgba(201,164,76,0.12)',
                      color: 'rgba(201,164,76,0.35)',
                    }),
                }}
              >
                {phase === "betting" ? "Place Bet" : "Placed"}
              </motion.button>
            </div>
          </div>
        ) : (
          /* ─── DESKTOP FOOTER LAYOUT (unchanged) ─── */
          <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3">
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

            <div className="flex items-center gap-2 order-2 tournament-controls-mobile" style={{ paddingRight: '8px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '5px 12px',
                background: 'rgba(201,164,76,0.1)',
                border: '1px solid rgba(201,164,76,0.3)',
                borderRadius: '8px',
                minWidth: '100px',
                boxShadow: '0 0 12px rgba(201,164,76,0.1)',
              }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a44c', fontWeight: 900, marginBottom: '1px' }}>Total Bet</span>
                <span style={{ fontSize: '20px', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>${totalBet.toLocaleString()}</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              <div className="flex items-center gap-1">
                {[
                  { label: 'Rebet', onClick: handleRebet, disabled: phase !== "betting" || lastSpinBets.size === 0 || myChips < lastTotal },
                  { label: 'Undo', onClick: handleClearLastBet, disabled: phase !== "betting" || betPlacementHistory.length === 0 },
                  { label: 'Clear', onClick: handleClearBets, disabled: phase !== "betting" || bets.size === 0 },
                ].map(btn => (
                  <motion.button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
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
                      ...(btn.disabled ? {
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
                    {btn.label}
                  </motion.button>
                ))}
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
              <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '5px 12px',
                background: 'rgba(201,164,76,0.1)',
                border: '1px solid rgba(201,164,76,0.3)',
                borderRadius: '8px',
                minWidth: '100px',
                boxShadow: '0 0 12px rgba(201,164,76,0.1)',
              }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a44c', fontWeight: 900, marginBottom: '1px' }}>Balance</span>
                <span style={{ fontSize: '20px', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>${myChips.toLocaleString()}</span>
              </div>
              <div className="relative" style={{ marginRight: '8px' }}>
                <motion.button
                  onClick={handleSubmitBets}
                  disabled={phase !== "betting"}
                  whileHover={phase === 'betting' && bets.size > 0 ? { scale: 1.02 } : {}}
                  whileTap={phase === 'betting' && bets.size > 0 ? { scale: 0.97 } : {}}
                  className="tournament-submit-btn"
                  style={{
                    height: '38px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    fontFamily: "'Georgia', serif",
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
        )}
      </footer>

      <ResultDisplay
        visible={showResult}
        onDismiss={handleDismissResult}
        result={lastSpinResult}
        payout={lastPlayerPayout}
        tournamentMode={true}
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

/* ─── Small helper: landscape mobile icon button ─── */
function LandscapeMobileBtn({
  label,
  onClick,
  disabled,
  accent = false,
  title,
}: {
  label: string;
  onClick: () => void | boolean;
  disabled: boolean;
  accent?: boolean;
  title?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.92 }}
      title={title}
      style={{
        width: '32px', /* increased sizes for better accessibility */
        height: '32px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        transition: 'all 0.15s ease',
        border: '1px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        ...(disabled ? {
          background: 'transparent',
          borderColor: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.12)',
        } : accent ? {
          background: 'rgba(201,164,76,0.1)',
          borderColor: 'rgba(201,164,76,0.3)',
          color: '#c9a44c',
        } : {
          background: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)',
        }),
      }}
    >
      {label}
    </motion.button>
  );
}