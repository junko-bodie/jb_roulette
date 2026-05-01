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
import { soundEngine } from '@/lib/audioEngine';
import Toast from '@/components/ui/Toast';

import { useRouter } from 'next/navigation';

export default function GamePage() {
  const { user, isLoading: authLoading, userProfile, isSoundEnabled, isPopupEnabled } = useGame();
  const router = useRouter();
  const game = useGameState();

  const [showResult, setShowResult] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelSize, setWheelSize] = useState(480);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
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

  const handleDismissResult = useCallback(() => {
    setShowResult(false);
    game.startNewRound();
  }, [game]);

  const handleSpinComplete = useCallback(() => {
    setIsSpinningWheel(false);
    game.resolveResult();

    if (isPopupEnabled) {
      setShowResult(true);
    } else {
      // If popup disabled, just wait 0.8s and start new round
      setTimeout(() => {
        handleDismissResult();
      }, 1000);
    }
  }, [game, isPopupEnabled, handleDismissResult]);

  // Trigger win celebration
  useEffect(() => {
    if (game.lastPayout && game.lastPayout.totalWon > 0 && isPopupEnabled) {
      setShowWinCelebration(true);
    }
  }, [game.lastPayout, isPopupEnabled]);

  // Automatically dismiss result after 3 seconds
  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        handleDismissResult();
      }, 3000);
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
        setWheelSize(Math.min(window.innerWidth * 0.62, 280));
      } else if (isLandscapeMobile) {
        setWheelSize(360);
      } else if (window.innerHeight < 600) {
        setWheelSize(420);
      } else if (window.innerHeight < 750) {
        setWheelSize(520);
      } else if (window.innerWidth < 1300 || window.innerHeight < 900) {
        setWheelSize(620);
      } else {
        setWheelSize(720);
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
      className="flex flex-col h-screen h-[100dvh] w-full overflow-y-auto md:overflow-hidden select-none mobile-root-scroll"
      style={{ background: '#06140e' }}
    >
      {/* ═══ TOP BAR — HISTORY & SETTINGS ═══ */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-2 z-10 mobile-header-compact"
        style={{
          background: 'linear-gradient(to bottom, #3b2518, #1c100a)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          minHeight: isMobile ? '48px' : '60px',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/lobby'}
            className="text-[#c9a44c] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <SpinHistory history={game.history} />
        </div>

        <div className="flex items-center gap-4">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[#c9a44c] transition-all"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

        </div>
      </header>

      <div className="mobile-rotate-warning">
        <div className="mobile-rotate-card">
          <p className="mobile-rotate-title">Rotate Device</p>
          <p className="mobile-rotate-text">This game is designed for landscape mode on mobile.</p>
        </div>
      </div>

      <main className="mobile-game-content mobile-landscape-main flex-1 min-h-0 relative px-0 py-0 overflow-y-auto md:overflow-hidden flex flex-col justify-between items-center h-full">

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
        className="flex-shrink-0 w-full px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-between z-10 mobile-footer-compact gap-1 sm:gap-0"
        style={{
          background: 'linear-gradient(to top, #1a0f09 0%, #2d1a10 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.3)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          padding: isMobile ? '4px 10px' : '8px 16px',
        }}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <ChipTray
            selectedChip={game.selectedChip}
            onSelectChip={game.setSelectedChip}
            balance={game.balance}
            totalBet={game.totalBet}
            disabled={isSpinningWheel}
          />
        </div>

        {/* Center space is now empty in flex-justify, but we will place the floating card absolutely */}
        <div className="hidden md:block w-[300px]" /> 

        {/* Right: Balance + Stats */}
        <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto justify-center overflow-x-auto flex-nowrap py-1 sm:py-0">
          {/* Balance */}
          <div className="flex flex-col items-center px-2 sm:px-4 py-1 rounded-lg bg-gradient-to-b from-[#3b2518] to-black border border-[#c9a44c]/40 shadow-inner min-w-[60px]">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-[#c9a44c]/80 font-bold">Balance</span>
            <span className="text-xs sm:text-sm font-black text-[#f4fbfb]" style={{ fontFamily: 'var(--font-playfair)' }}>
              ${game.balance.toLocaleString()}
            </span>
          </div>

          {/* Session Stats (Last Bet, Last Win, Session) */}
          <div className="hidden sm:flex">
            <SessionStats {...game.sessionStats} />
          </div>

          {/* Total Bet */}
          <div className="flex flex-col items-center px-2 sm:px-4 py-1 rounded-lg bg-black/40 border border-[#c9a44c]/30 shadow-inner min-w-[60px]">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.15em] text-[#c9a44c]/70 font-bold">Total Bet</span>
            <span className="text-xs sm:text-sm font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              ${game.totalBet.toLocaleString()}
            </span>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING PLAYER CARD — Bridges Footer & Table ═══ */}
      <div 
        onClick={() => {
          soundEngine?.playClick();
          setIsProfileOpen(true);
        }}
        className="hidden md:flex absolute bottom-[10px] left-1/2 -translate-x-1/2 z-[20] items-center gap-6 px-10 py-3 rounded-full bg-black/60 border-2 border-[#c9a44c]/40 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(201,164,76,0.15)] hover:bg-black/80 hover:border-[#c9a44c] transition-all cursor-pointer group active:scale-95"
        style={{
          boxShadow: '0 -8px 30px rgba(0,0,0,0.8), inset 0 0 15px rgba(201, 164, 76, 0.1)',
        }}
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-[#c9a44c]/80 overflow-hidden bg-black/80 shadow-2xl group-hover:border-[#c9a44c] transition-all group-hover:scale-110">
            <img
              src={userProfile?.avatar || '/avatars/default.png'}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-lg" />
        </div>
        <div className="flex flex-col">
          <span
            className="text-white font-black text-xl leading-tight tracking-tight shadow-black drop-shadow-lg group-hover:text-[#c9a44c] transition-colors"
            style={{ fontFamily: "'Bodoni Moda', serif", fontStyle: 'italic' }}
          >
            Hello {userProfile?.name}!
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#c9a44c] uppercase tracking-[0.4em] font-black leading-none">
              Elite VIP Member
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] animate-pulse" />
          </div>
        </div>
      </div>

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
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Insufficient Funds Toast */}
      <Toast
        message={game.fundError || ''}
        isVisible={!!game.fundError}
        onClose={() => game.setFundError(null)}
        type="error"
      />
    </div>
  );
}