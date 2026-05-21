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
import Avatar from '@/components/ui/Avatar';

import { useRouter } from 'next/navigation';

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
          <rect x="20" y="8" width="32" height="56" rx="6" stroke="#c9a44c" strokeWidth="3" fill="none" />
          <circle cx="36" cy="57" r="3" fill="#c9a44c" opacity="0.6" />
          <rect x="24" y="16" width="24" height="34" rx="2" fill="rgba(201,164,76,0.08)" stroke="rgba(201,164,76,0.2)" strokeWidth="1" />
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
          textTransform: 'uppercase' as const,
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
          The roulette game is optimised for landscape view. Please rotate your phone sideways to play.
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
        <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          ↺ Turn sideways to begin
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

export default function GamePage() {
  const { user, isLoading: authLoading, userProfile, isSoundEnabled, isMusicEnabled, isPopupEnabled } = useGame();
  const router = useRouter();
  const game = useGameState();
  const isPortraitMobile = useIsPortraitMobile();

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

  // Handle background music
  useEffect(() => {
    if (isMusicEnabled) {
      import('@/lib/audioEngine').then(({ soundEngine }) => {
        soundEngine?.playBackgroundMusic();
      });
    } else {
      import('@/lib/audioEngine').then(({ soundEngine }) => {
        soundEngine?.stopBackgroundMusic();
      });
    }

    return () => {
      import('@/lib/audioEngine').then(({ soundEngine }) => {
        soundEngine?.stopBackgroundMusic();
      });
    };
  }, [isMusicEnabled]);

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
      handleSpin();
    }, 1500);
  }, [game, handleSpin]);

  useEffect(() => {
    const updateWheelSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobilePortrait =
        window.innerWidth <= 900 &&
        window.matchMedia('(orientation: portrait)').matches;
      const isLandscapeMobile =
        isLandscape && window.innerHeight <= 540 && window.innerWidth <= 1024;

      if (isMobilePortrait) {
        setWheelSize(Math.min(window.innerWidth * 0.62, 280));
      } else if (isLandscapeMobile) {
        // Use available height for proper landscape sizing
        const availableH = window.innerHeight - 48 - 60; // header + footer
        setWheelSize(Math.min(availableH * 0.85, 260));
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

  // ══════ PORTRAIT LOCK OVERLAY ══════
  if (isPortraitMobile) {
    return <PortraitLockOverlay />;
  }

  return (
    <div
      className="flex flex-col h-screen h-[100dvh] w-full overflow-y-auto md:overflow-hidden select-none mobile-root-scroll"
      style={{ background: '#06140e' }}
    >
      {/* ═══ TOP BAR — HISTORY & SETTINGS ═══ */}
      <header
        className="flex-shrink-0 z-10 mobile-header-compact"
        style={{
          background: 'linear-gradient(to bottom, #4a2f1f, #26170f)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.6)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          minHeight: isMobile ? '48px' : '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="flex items-center justify-between w-full px-12 md:px-24 max-w-[1250px] mx-auto min-w-0">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => window.location.href = '/lobby'}
              className="text-[#f5edd5] hover:text-white transition-colors flex-shrink-0"
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
              className="p-3.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-110 text-[#f5edd5] transition-all shadow-lg"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7.5 w-7.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

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
          background: 'linear-gradient(to top, #26170f 0%, #4a2f1f 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.5)',
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
        <div className="hidden lg:block w-[100px]" />

        {/* Right: Balance + Stats */}
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center overflow-x-auto flex-nowrap py-1 sm:py-0">
          {/* Balance */}
          <div className="flex flex-col items-center px-1 sm:px-1.5 lg:px-2 py-1 sm:py-2 lg:py-5 rounded-lg bg-gradient-to-b from-[#7a553a] to-[#2d1e12] border border-[#c9a44c]/60 shadow-inner lg:min-w-[90px]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-[#fff] font-bold">Balance</span>
            <span className="text-sm sm:text-base font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              ${game.balance.toLocaleString()}
            </span>
          </div>

          {/* Session Stats (Last Bet, Last Win, Session) */}
          <div className="hidden sm:flex">
            <SessionStats {...game.sessionStats} />
          </div>

          {/* Total Bet */}
          <div className="flex flex-col items-center px-1 sm:px-1.5 lg:px-2 py-1 sm:py-2 lg:py-5 rounded-lg bg-white/10 border border-[#c9a44c]/50 shadow-inner lg:min-w-[90px]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-[#f5d68d] font-bold">Total Bet</span>
            <span className="text-sm sm:text-base font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
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
        className="hidden lg:flex absolute bottom-[10px] left-1/2 -translate-x-1/2 z-[20] items-center gap-4 px-6 py-2 rounded-full border-2 border-[#c9a44c]/40 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(201,164,76,0.15)] hover:border-[#c9a44c] transition-all cursor-pointer group active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #5c3b27 0%, #3d271a 100%)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.8), inset 0 0 15px rgba(201, 164, 76, 0.1)',
        }}
      >
        <div className="relative">
          <Avatar 
            type={userProfile?.avatar || 'default'} 
            className="w-14 h-14 border-2 border-[#c9a44c]/80 shadow-2xl group-hover:border-[#c9a44c] transition-all group-hover:scale-110"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-lg" />
        </div>
        <div className="flex flex-col">
          <span
            className="text-white font-black text-xl leading-tight tracking-tight shadow-black drop-shadow-lg group-hover:text-[#c9a44c] transition-colors"
            style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
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
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetSession={game.resetSessionStats} />

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