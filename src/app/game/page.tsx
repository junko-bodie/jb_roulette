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

export default function GamePage() {
  const game = useGameState();
  const [showResult, setShowResult] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelSize, setWheelSize] = useState(480);
  const wheelRef = useRef<HTMLDivElement>(null);


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

  const isBettingDisabled = false;

  useEffect(() => {
    const updateWheelSize = () => {
      const isLandscapeMobile =
        window.matchMedia('(orientation: landscape)').matches &&
        window.innerHeight <= 540 &&
        window.innerWidth <= 950;
      if (isLandscapeMobile) {
        setWheelSize(200);
      } else if (window.innerHeight < 750) {
        setWheelSize(300);
      } else if (window.innerWidth < 1100 || window.innerHeight < 850) {
        setWheelSize(360);
      } else {
        setWheelSize(440); // Enlarged from 320
      }
    };

    updateWheelSize();
    window.addEventListener('resize', updateWheelSize);
    return () => window.removeEventListener('resize', updateWheelSize);
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden select-none"
      style={{ background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)` }}
    >
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-0.5 z-10 gap-3"
        style={{
          background: 'linear-gradient(to bottom, #3b2518, #1c100a)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-base font-bold tracking-wider"
            style={{
              fontFamily: 'var(--font-playfair)',
              color: '#f4fbfb',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            Junko Bodie
          </h1>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: 'linear-gradient(135deg, #c9a44c, #8b6b22)',
              color: '#fff',
              fontFamily: 'var(--font-inter)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Roulette
          </span>
        </div>

        <div className="flex items-center gap-8">
          <SessionStats {...game.sessionStats} />
          <SpinHistory history={game.history} />

          <div className="flex items-center gap-6">
            {/* Bet Display - Prominent */}
            <div className="flex flex-col items-center px-6 py-1 rounded-xl bg-black/40 border border-[#c9a44c]/40 shadow-[0_0_15px_rgba(201,164,76,0.2)]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a44c] font-bold mb-0.5">Total Bet</span>
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                ${game.totalBet.toLocaleString()}
              </span>
            </div>

            {/* Balance Display - Prominent */}
            <div className="flex flex-col items-center px-6 py-1 rounded-xl bg-gradient-to-b from-[#3b2518] to-black border-2 border-[#c9a44c]/60 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a44c]/80 font-bold mb-0.5">Balance</span>
              <span className="text-2xl font-black text-[#f4fbfb]" style={{ fontFamily: 'var(--font-playfair)' }}>
                ${game.balance.toLocaleString()}
              </span>
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

      <main className="mobile-game-content mobile-landscape-main flex-1 relative px-0.5 md:px-1 lg:px-2 py-0 overflow-hidden flex flex-col justify-start pt-4 items-center">

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
        />
      </main>

      {/* NEW BOTTOM BAR (CHANGE 11) */}
      <footer
        className="flex-shrink-0 h-24 w-full px-6 flex items-center justify-between z-10"
        style={{
          background: 'linear-gradient(to top, #1a0f09 0%, #2d1a10 100%)',
          borderTop: '1px solid rgba(201, 164, 76, 0.3)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
        }}
      >
        {/* Left: Chip Selection Tray */}
        <div className="flex-1 max-w-[500px]">
          <ChipTray
            selectedChip={game.selectedChip}
            onSelectChip={game.setSelectedChip}
            balance={game.balance}
            totalBet={game.totalBet}
            disabled={isSpinningWheel}
          />
        </div>

        {/* Center: Player Info Placeholder */}
        <div className="flex items-center gap-3 px-8 border-x border-white/5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a44c] to-[#8b6b22] border-2 border-white/10 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">JB</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#c9a44c] uppercase tracking-widest">Player One</span>
            <span className="text-[10px] text-white/40">Tier: High Roller</span>
          </div>
        </div>

        {/* Right: Action Buttons Group */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Rebet */}
          <button
            onClick={game.rebet}
            disabled={isSpinningWheel || game.phase !== 'BETTING' || !game.hasLastSpin}
            className="px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border border-[#c9a44c]/30 bg-[#c9a44c]/10 text-[#c9a44c] hover:bg-[#c9a44c]/20 disabled:opacity-20 disabled:grayscale"
          >
            Rebet
          </button>

          {/* Clear Last Bet */}
          <button
            onClick={game.clearLastBet}
            disabled={isSpinningWheel || game.phase !== 'BETTING' || game.bets.size === 0}
            className="px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-20"
          >
            Clear Last Bet
          </button>

          {/* Clear All */}
          <button
            onClick={game.clearBets}
            disabled={isSpinningWheel || game.phase !== 'BETTING' || game.bets.size === 0}
            className="px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border border-red-500/20 bg-red-500/5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-20"
          >
            Clear
          </button>

          {/* SPIN - LARGEST */}
          <button
            onClick={handleSpin}
            disabled={isSpinningWheel || game.phase !== 'BETTING' || game.bets.size === 0}
            className={`
              ml-2 px-12 py-4 rounded-xl font-black text-xl uppercase tracking-widest transition-all duration-300 shadow-xl
              ${(game.bets.size > 0 && !(isSpinningWheel || game.phase !== 'BETTING'))
                ? 'bg-gradient-to-b from-[#10b981] to-[#047857] text-white scale-105 hover:scale-110 active:scale-95 shadow-emerald-500/20'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'}
            `}
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {isSpinningWheel ? 'Spinning...' : 'Spin'}
          </button>
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
    </div>
  );
}