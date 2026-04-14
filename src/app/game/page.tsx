'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouletteTable from '@/components/table/RouletteTable';
import ChipTray from '@/components/chips/ChipTray';
import ResultDisplay from '@/components/ui/ResultDisplay';
import SpinHistory from '@/components/ui/SpinHistory';
import SessionStats from '@/components/ui/SessionStats';
import WinCelebration from '@/components/ui/WinCelebration';
import { useGameState } from '@/hooks/useGameState';
import { useGame } from '@/context/GameContext';
import SettingsModal from '@/components/ui/SettingsModal';
import ProfileModal from '@/components/ui/ProfileModal';

import { useRouter } from 'next/navigation';

export default function GamePage() {
  const { user, isLoading: authLoading, userProfile, isSoundEnabled } = useGame();
  const router = useRouter();
  const game = useGameState();

  const [showResult, setShowResult] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelSize, setWheelSize] = useState(480);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleSpin = useCallback(async () => {
    const result = await game.executeSpin();
    if (!result) return;

    setIsSpinningWheel(true);
    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [game]);

  const handleSpinComplete = useCallback(() => {
    setIsSpinningWheel(false);
    game.resolveResult();
    setShowResult(true);
  }, [game]);

  // Trigger win celebration
  useEffect(() => {
    if (game.lastPayout && game.lastPayout.totalWon > 0) {
      setShowWinCelebration(true);
    }
  }, [game.lastPayout]);

  const handleDismissResult = useCallback(() => {
    setShowResult(false);
    game.startNewRound();
  }, [game]);

  // Automatically dismiss result after 2 seconds
  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        handleDismissResult();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showResult, handleDismissResult]);

  const handleTimeout = useCallback(() => {
    // 1. Lock bets immediately
    game.setPhase('LOCKED');
    
    // Play lock sound
    if (isSoundEnabled) {
      import('@/lib/audioEngine').then(({ soundEngine }) => {
        soundEngine?.playLockSound();
      });
    }

    // 2. Short dramatic pause, then spin
    setTimeout(() => {
      // Re-check phase to ensure we're still locked (optional)
      if (game.bets.size > 0) {
        handleSpin();
      } else {
        // If no bets, just reset to betting or wait for user
        game.startNewRound();
      }
    }, 1500);
  }, [game, handleSpin]);

  useEffect(() => {
    const updateWheelSize = () => {
      const isMobilePortrait =
        window.innerWidth <= 900 &&
        window.matchMedia('(orientation: portrait)').matches;
      const isLandscapeMobile =
        window.matchMedia('(orientation: landscape)').matches &&
        window.innerHeight <= 540 &&
        window.innerWidth <= 950;
      if (isMobilePortrait) {
        setWheelSize(Math.min(window.innerWidth * 0.85, 360));
      } else if (isLandscapeMobile) {
        setWheelSize(320);
      } else if (window.innerHeight < 750) {
        setWheelSize(500);
      } else if (window.innerWidth < 1300 || window.innerHeight < 900) {
        setWheelSize(600);
      } else {
        setWheelSize(700);
      }
    };

    updateWheelSize();
    window.addEventListener('resize', updateWheelSize);
    return () => window.removeEventListener('resize', updateWheelSize);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1f1a]">
        <div className="text-[#c9a44c] text-2xl font-black tracking-widest animate-pulse">
          LOADING CASINO...
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden sm:overflow-hidden select-none mobile-root-scroll"
      style={{ background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)` }}
    >
      {/* ═══ TOP BAR — HISTORY & SETTINGS ═══ */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-2 z-10 mobile-header-compact"
        style={{
          background: 'linear-gradient(to bottom, #3b2518, #1c100a)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          minHeight: '60px',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="text-[#c9a44c] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <SpinHistory history={game.history} />
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[11px] font-bold text-white leading-tight">{userProfile.name}</span>
              <span className="text-[8px] text-[#c9a44c] uppercase tracking-wider font-medium">Player</span>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-[#c9a44c]/40 overflow-hidden bg-black/40">
              <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-rotate-warning">
        <div className="mobile-rotate-card">
          <p className="mobile-rotate-title">Rotate Device</p>
          <p className="mobile-rotate-text">This game is designed for landscape mode on mobile.</p>
        </div>
      </div>

      <main className="mobile-game-content mobile-landscape-main flex-1 relative px-0.5 md:px-1 lg:px-2 py-0 overflow-visible sm:overflow-hidden flex flex-col justify-start pt-0 items-center">

        <RouletteTable
          wheelType={game.wheelType}
          currentResult={game.currentResult}
          isSpinning={isSpinningWheel}
          onSpinComplete={handleSpinComplete}
          wheelSize={wheelSize}
          wheelRef={wheelRef}
          bets={game.bets}
          onPlaceBet={game.placeBet}
          onRemoveBet={game.removeBet}
          isBettingDisabled={isSpinningWheel || game.phase !== 'BETTING'}
          lastPayout={game.lastPayout}
          phase={game.phase}
          setWheelType={game.setWheelType}
          onSpin={handleSpin}
          onRebet={game.rebet}
          onClearBets={game.clearBets}
          onClearLastBet={game.clearLastBet}
          hasLastSpin={game.hasLastSpin}
          balance={game.balance}
          totalBet={game.totalBet}
          onDoubleAllBets={game.doubleAllBets}
          onToggleDeleteMode={game.toggleDeleteMode}
          deleteMode={game.deleteMode}
          onPopLastChip={game.popLastChip}
          onClearZone={game.clearZone}
          onTimeout={handleTimeout}
        />
      </main>

      {/* ═══ FOOTER — Chips left, Stats right ═══ */}
      <footer
        className="flex-shrink-0 w-full px-4 flex items-center justify-between z-10 mobile-footer-compact"
        style={{
          background: 'linear-gradient(to top, #1a0f09 0%, #2d1a10 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.3)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          padding: '8px 16px',
        }}
      >
        {/* Left: Chip Selection Tray + Player Info */}
        <div className="flex items-center gap-3">
          <div className="max-w-[400px]">
            <ChipTray
              selectedChip={game.selectedChip}
              onSelectChip={game.setSelectedChip}
              balance={game.balance}
              totalBet={game.totalBet}
              disabled={isSpinningWheel}
            />
          </div>

          {/* Player Info */}
          <div className="hidden sm:flex items-center gap-2 px-4 border-x border-white/5 mobile-player-info">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a44c] to-[#8b6b22] border-2 border-white/10 flex items-center justify-center shadow-lg overflow-hidden">
              <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#c9a44c] uppercase tracking-widest">{userProfile.name}</span>
              <span className="text-[9px] text-white/40">Tier: High Roller</span>
            </div>
          </div>
        </div>

        {/* Right: Balance + Stats */}
        <div className="flex items-center gap-3">
          {/* Balance */}
          <div className="flex flex-col items-center px-4 py-1 rounded-lg bg-gradient-to-b from-[#3b2518] to-black border border-[#c9a44c]/40 shadow-inner">
            <span className="text-[9px] uppercase tracking-[0.15em] text-[#c9a44c]/80 font-bold">Balance</span>
            <span className="text-sm font-black text-[#f4fbfb]" style={{ fontFamily: 'var(--font-playfair)' }}>
              ${game.balance.toLocaleString()}
            </span>
          </div>

          {/* Session Stats (Last Bet, Last Win, Session) */}
          <SessionStats {...game.sessionStats} />

          {/* Total Bet */}
          <div className="flex flex-col items-center px-4 py-1 rounded-lg bg-black/40 border border-[#c9a44c]/30 shadow-inner">
            <span className="text-[9px] uppercase tracking-[0.15em] text-[#c9a44c]/70 font-bold">Total Bet</span>
            <span className="text-sm font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              ${game.totalBet.toLocaleString()}
            </span>
          </div>
        </div>
      </footer>

      <ResultDisplay
        result={game.currentResult}
        payout={game.lastPayout}
        visible={showResult}
        onDismiss={handleDismissResult}
      />

      <WinCelebration
        show={showWinCelebration}
        onComplete={() => setShowWinCelebration(false)}
      />

      {/* Modals */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}