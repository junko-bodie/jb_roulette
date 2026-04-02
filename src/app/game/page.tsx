'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouletteTable from '@/components/table/RouletteTable';
import ChipTray from '@/components/chips/ChipTray';
import ResultDisplay from '@/components/ui/ResultDisplay';
import SpinHistory from '@/components/ui/SpinHistory';
import { useGameState } from '@/hooks/useGameState';

export default function GamePage() {
  const game = useGameState();
  const [showResult, setShowResult] = useState(false);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelSize, setWheelSize] = useState(520);
  const wheelRef = useRef<HTMLDivElement>(null);

  const luckyNumbers = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of game.history) {
      counts.set(item.number, (counts.get(item.number) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([number, count]) => ({
        display: number === 37 ? '00' : String(number),
        hitRate: game.history.length > 0 ? (count / game.history.length) * 100 : 0,
      }));
  }, [game.history]);

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
        setWheelSize(290);
      } else if (window.innerWidth < 1100) {
        setWheelSize(380);
      } else {
        setWheelSize(460);
      }
    };

    updateWheelSize();
    window.addEventListener('resize', updateWheelSize);
    return () => window.removeEventListener('resize', updateWheelSize);
  }, []);

  return (
    <div
      className="flex flex-col h-[100dvh] w-full overflow-hidden select-none"
      style={{ background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)` }}
    >
      <header
        className="flex items-center justify-between px-4 lg:px-6 py-3 z-10 gap-3"
        style={{
          background: 'linear-gradient(to bottom, #3b2518, #1c100a)',
          borderBottom: '2px solid rgba(201, 164, 76, 0.4)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-lg font-bold tracking-wider"
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
            className="text-xs px-2 py-0.5 rounded"
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

        <div className="flex items-center gap-2 md:gap-4">
          <SpinHistory history={game.history} />
          <div className="flex items-center gap-4 px-3 py-1.5 rounded-full bg-black/30 border border-[#c9a44c]/30">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter text-[#c9a44c]/80 font-bold">Balance</span>
              <span className="text-sm font-mono font-bold text-white">${game.balance.toLocaleString()}</span>
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

      <main className="mobile-game-content mobile-landscape-main flex-1 relative px-1.5 md:px-2 lg:px-3 py-4 overflow-y-auto overflow-x-hidden flex flex-col justify-center items-center">
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[230px] md:max-w-[250px] rounded-lg border p-2 h-fit md:absolute md:left-2 md:top-4 z-20 backdrop-blur-md"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 30, 25, 0.85) 0%, rgba(10, 15, 10, 0.95) 100%)',
            borderColor: 'rgba(201, 164, 76, 0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <h2
            className="text-sm font-semibold mb-2 text-[#c9a44c] uppercase tracking-wider text-center"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Hot Numbers
          </h2>
          <div className="space-y-2">
            {luckyNumbers.length === 0 ? (
              <p className="text-xs text-white/50 text-center italic">Spin to populate stats</p>
            ) : (
              luckyNumbers.map((entry) => (
                <div key={entry.display} className="grid grid-cols-[30px_1fr_48px] items-center gap-2">
                  <span className="text-sm font-bold text-white text-center">{entry.display}</span>
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#c9a44c] to-[#e4c97b]"
                      style={{ width: `${entry.hitRate}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-right text-white/80 font-mono">
                    {entry.hitRate.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.aside>

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
          isBettingDisabled={isBettingDisabled}
          lastPayout={game.lastPayout}
          phase={game.phase}
          setWheelType={game.setWheelType}
          clearBets={game.clearBets}
          totalBet={game.totalBet}
          handleSpin={handleSpin}
        />
      </main>

      <ChipTray
        selectedChip={game.selectedChip}
        onSelectChip={game.setSelectedChip}
        balance={game.balance}
        totalBet={game.totalBet}
        disabled={isBettingDisabled}
      />

      <ResultDisplay
        result={game.currentResult}
        payout={game.lastPayout}
        visible={showResult}
        onDismiss={handleDismissResult}
      />
    </div>
  );
}