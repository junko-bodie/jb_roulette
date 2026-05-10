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
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const updateWheelSize = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = isTouchDevice && window.innerWidth <= 1024;
      setIsMobile(mobile);
      setSidebarWidth(window.innerWidth < 1100 ? 220 : 280);

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

  const myChips = Math.max(0, player?.current_chips || 0);

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
        height: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1e7a5e 0%, #0a2318 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: isMobile ? '8px' : '24px',
      }}>
        {/* Thematic Background Elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.08)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.05)', borderRadius: '50%', filter: 'blur(100px)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.card}
          style={{
            zIndex: 10,
            width: '100%',
            maxWidth: isMobile ? '100%' : '1000px',
            background: '#f5edd5',
            padding: isMobile ? '12px 16px' : 'clamp(32px, 6vh, 60px) clamp(24px, 4vw, 56px)',
            textAlign: 'center' as const,
            position: 'relative' as const,
            overflow: 'visible' // Allow notches to overlap
          }}
        >
          {/* Theme Decorations */}
          <div className={styles.cardBorder} />
          <div className={styles.cornerTL} />
          <div className={styles.cornerTR} />
          <div className={styles.cornerBL} />
          <div className={styles.cornerBR} />

          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,164,76,0.3), transparent)' }} />

          <div style={{ color: '#8b6914', fontWeight: 900, letterSpacing: '0.4em', fontSize: isMobile ? '11px' : '14px', textTransform: 'uppercase', marginBottom: isMobile ? '12px' : '20px', fontFamily: "'Arial Narrow', Arial, sans-serif" }}>
            Tournament Matchmaking
          </div>
          <h2 className={styles.title} style={{
            fontSize: isMobile ? '24px' : 'clamp(36px, 5vw, 52px)',
            marginBottom: isMobile ? '8px' : '16px',
            color: '#051410',
            fontWeight: 900,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Searching for Players...
          </h2>
          <p style={{ color: '#3a3028', fontSize: isMobile ? '14px' : '18px', marginBottom: isMobile ? '12px' : 'clamp(32px, 6vh, 52px)', fontWeight: 500, fontFamily: 'Georgia, serif', opacity: 0.9 }}>
            Match begins automatically in <span style={{ color: '#c9a44c', fontWeight: 800 }}>{lobbyTimeRemaining}s</span>
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '10px' : 'clamp(12px, 2vh, 24px)',
            marginBottom: isMobile ? '16px' : 'clamp(24px, 5vh, 48px)'
          }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const p = tournament.players[i];
              return (
                <div key={i} style={{
                  background: p ? '#ffffff' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${p ? 'rgba(201,164,76,0.4)' : 'rgba(201,164,76,0.1)'}`,
                  borderRadius: isMobile ? '10px' : '16px',
                  padding: isMobile ? '12px 6px' : 'clamp(20px, 4vh, 36px) clamp(10px, 2vw, 16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '6px' : '12px',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: p ? '0 12px 24px rgba(0,0,0,0.06)' : 'none',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar type={p?.avatar_url || 'default'} size={isMobile ? 'sm' : 'lg'} />
                    {p && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: isMobile ? '8px' : '12px', height: isMobile ? '8px' : '12px', background: '#4ade80', borderRadius: '50%', border: '2.5px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />}
                  </div>
                  <span style={{
                    color: p ? '#0f2318' : 'rgba(15,35,24,0.30)',
                    fontSize: isMobile ? '9px' : 'clamp(11px, 2vw, 14px)',
                    fontWeight: 800,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: "'Arial Narrow', Arial, sans-serif"
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
            gap: isMobile ? '8px' : '12px',
            background: 'rgba(201, 164, 76, 0.08)',
            padding: isMobile ? '8px 20px' : '14px 32px',
            borderRadius: '100px',
            width: 'fit-content',
            margin: '0 auto',
            border: '1.5px solid rgba(201, 164, 76, 0.2)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              style={{
                width: isMobile ? '14px' : '18px',
                height: isMobile ? '14px' : '18px',
                border: '2px solid rgba(201,164,76,0.1)',
                borderTopColor: '#c9a44c',
                borderRadius: '50%'
              }}
            />
            <span style={{ color: '#3a3028', fontWeight: 800, fontSize: isMobile ? '10px' : '13px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Arial Narrow', Arial, sans-serif" }}>
              Matched <span style={{ color: '#8b6914' }}>{tournament.players.length}/6</span> Players
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
        style={{ background: 'radial-gradient(circle at center, #247a5e 0%, #0a1e14 100%)' }}>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-100%] opacity-30"
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
            className="text-[#c9a44c] font-black text-sm uppercase tracking-[0.5em] mb-4"
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

          <div className="flex flex-wrap justify-center gap-6 mb-10 px-2">
            {tournament?.players?.slice(0, 6).map((p, i) => (
              <motion.div
                key={p.player_id.toString()}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4 + (i * 0.08), duration: 0.3 }}
                className="relative flex flex-col items-center gap-2"
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
                <span className="text-[#c9a44c] text-[13px] font-black uppercase tracking-widest">
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
              <span className="text-white/90 font-black text-[11px] uppercase tracking-[0.3em]">
                Round {currentRound} Starting
              </span>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-[#c9a44c] font-bold text-sm uppercase tracking-widest"
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
            <span style={{
              color: '#f5e9b8',
              fontSize: isMobile ? '9px' : '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginTop: isMobile ? 0 : '4px',
              opacity: 0.9
            }}>
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
              background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.3)',
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
              background: 'linear-gradient(180deg, rgba(22, 60, 48, 0.8) 0%, rgba(12, 35, 25, 0.9) 100%)',
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
              background: 'linear-gradient(180deg, rgba(22, 60, 48, 0.7) 0%, rgba(12, 35, 25, 0.8) 100%)',
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
              width: phase === "spinning" ? 0 : sidebarWidth,
              opacity: phase === "spinning" ? 0 : 1,
              x: phase === "spinning" ? 100 : 0
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              padding: '24px 8px 24px 0', /* Reduced right padding to fill corner */
              height: '100%',
              overflow: 'visible',
            }}
          >
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
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
          background: 'linear-gradient(to top, #26170f 0%, #4a2f1f 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.5)',
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


          </div>
        ) : (
          /* ─── DESKTOP FOOTER LAYOUT — Grid-based to ensure perfect center gap ─── */
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_280px_1fr] items-center gap-1 md:gap-1.5 w-full px-6">
            <div className="flex-shrink-0 order-1 justify-self-start">
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

            {/* Center Spacer for Floating Profile Card — Grid column 2 ensures geometric centering */}
            <div className="hidden md:block order-2" />

            <div className="flex items-center gap-1 order-3 justify-self-end tournament-controls-mobile" style={{ marginRight: '60px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4px 10px',
                background: 'rgba(201,164,76,0.1)',
                border: '1px solid rgba(201,164,76,0.3)',
                borderRadius: '8px',
                minWidth: '75px',
                boxShadow: '0 0 12px rgba(201,164,76,0.1)',
              }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a44c', fontWeight: 900, marginBottom: '1px' }}>Total Bet</span>
                <span style={{ fontSize: '20px', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>${totalBet.toLocaleString()}</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              <div className="flex items-center gap-2">
                {[
                  { label: 'Rebet', onClick: handleRebet, disabled: phase !== "betting" || lastSpinBets.size === 0 || myChips < lastTotal },
                  { label: 'Undo', onClick: handleClearLastBet, disabled: phase !== "betting" || betPlacementHistory.length === 0 },
                  { label: 'Clear', onClick: handleClearBets, disabled: phase !== "betting" || bets.size === 0 },
                ].map(btn => (
                  <motion.button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    whileHover={btn.disabled ? {} : { scale: 1.04, y: -1 }}
                    whileTap={btn.disabled ? {} : { scale: 0.96, y: 2 }}
                    className="flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                      ...(btn.disabled ? {
                        background: 'rgba(20,20,20,0.6)',
                        border: '2px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.15)',
                        boxShadow: 'none',
                      } : {
                        background: 'linear-gradient(180deg, #3a4a3e 0%, #2a3a2e 100%)',
                        border: '2.5px solid #c9a44c',
                        color: '#fff',
                        boxShadow: '0 4px 0 #1a0f09, 0 8px 16px rgba(0,0,0,0.5)',
                      }),
                    }}
                  >
                    {btn.label}
                  </motion.button>
                ))}
                <motion.button
                  onClick={handleDoubleAllBets}
                  disabled={phase !== "betting" || myChips < totalBet * 2 || totalBet === 0}
                  whileHover={(phase !== "betting" || myChips < totalBet * 2 || totalBet === 0) ? {} : { scale: 1.04, y: -1 }}
                  whileTap={(phase !== "betting" || myChips < totalBet * 2 || totalBet === 0) ? {} : { scale: 0.96, y: 2 }}
                  className="flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200"
                  style={{
                    height: '42px',
                    width: '42px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...((phase !== "betting" || myChips < totalBet * 2 || totalBet === 0) ? {
                      background: 'rgba(20,20,20,0.6)',
                      border: '2px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.15)',
                      boxShadow: 'none',
                    } : {
                      background: 'linear-gradient(180deg, #4a4030 0%, #3a3020 100%)',
                      border: '2.5px solid #c9a44c',
                      color: '#c9a44c',
                      boxShadow: '0 4px 0 #1a0f09, 0 8px 16px rgba(0,0,0,0.5), 0 0 14px rgba(201,164,76,0.12)',
                    }),
                  }}
                >
                  2×
                </motion.button>
                <motion.button
                  onClick={() => { soundEngine?.playSwoosh(); setDeleteMode(!deleteMode); }}
                  disabled={phase !== "betting"}
                  whileHover={phase !== "betting" ? {} : { scale: 1.04, y: -1 }}
                  whileTap={phase !== "betting" ? {} : { scale: 0.96, y: 2 }}
                  className="flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200"
                  style={{
                    height: '42px',
                    width: '42px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(phase !== "betting" ? {
                      background: 'rgba(20,20,20,0.6)',
                      border: '2px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.15)',
                      boxShadow: 'none',
                    } : deleteMode ? {
                      background: 'linear-gradient(180deg, #3a1515 0%, #2a0808 100%)',
                      border: '2.5px solid #f87171',
                      color: '#f87171',
                      boxShadow: '0 3px 0 #1a0f09, 0 6px 12px rgba(0,0,0,0.5), 0 0 14px rgba(220,38,38,0.2)',
                    } : {
                      background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                      border: '2.5px solid #c9a44c',
                      color: '#e4e0d4',
                      boxShadow: '0 3px 0 #1a0f09, 0 6px 12px rgba(0,0,0,0.5)',
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
                padding: '4px 10px',
                background: 'rgba(201,164,76,0.1)',
                border: '1px solid rgba(201,164,76,0.3)',
                borderRadius: '8px',
                minWidth: '75px',
                boxShadow: '0 0 12px rgba(201,164,76,0.1)',
              }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a44c', fontWeight: 900, marginBottom: '1px' }}>Balance</span>
                <span style={{ fontSize: '20px', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>${myChips.toLocaleString()}</span>
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

      {/* ═══ FLOATING PLAYER CARD — Bridges Footer & Table ═══ */}
      {!isMobile && (
        <div
          onClick={() => {
            soundEngine?.playClick();
            // setIsProfileOpen(true);
          }}
          className="flex absolute bottom-[18px] left-1/2 -translate-x-1/2 z-[40] items-center gap-3 px-5 py-2 rounded-full border-2 border-[#c9a44c]/40 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(201,164,76,0.2)] hover:border-[#c9a44c] transition-all cursor-pointer group active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #5c3b27 0%, #3d271a 100%)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.8), inset 0 0 15px rgba(201, 164, 76, 0.1)',
          }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#c9a44c]/80 overflow-hidden bg-black/80 shadow-2xl group-hover:border-[#c9a44c] transition-all group-hover:scale-110">
              <img
                src={userProfile?.avatar || '/avatars/default.png'}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#160e07] rounded-full shadow-lg" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-white font-black text-lg leading-tight tracking-tight shadow-black drop-shadow-lg group-hover:text-[#c9a44c] transition-colors"
              style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
            >
              {userProfile?.name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-[#c9a44c] uppercase tracking-[0.4em] font-black leading-none">
                Tournament Pro
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] animate-pulse" />
            </div>
          </div>
        </div>
      )}
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