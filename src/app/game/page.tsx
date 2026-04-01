/**
 * Junko Bodie Roulette Tournament — Game Page
 *
 * Main game orchestrator that composes all components:
 * - RouletteWheel (animated wheel)
 * - BettingLayout (number grid)
 * - ChipTray (chip selection)
 * - SpinButton, ResultDisplay, SpinHistory
 *
 * Manages the full game flow: bet → spin → animate → resolve → repeat.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouletteWheel from '@/components/table/RouletteWheel';
import BettingLayout from '@/components/table/BettingLayout';
import ChipTray from '@/components/chips/ChipTray';
import SpinButton from '@/components/ui/SpinButton';
import ResultDisplay from '@/components/ui/ResultDisplay';
import SpinHistory from '@/components/ui/SpinHistory';
import BettingTimer from '@/components/ui/BettingTimer';
import { useGameCycle } from '@/hooks/useGameCycle';
import { useGameState } from '@/hooks/useGameState';
import { COLORS } from '@/styles/theme';

export default function GamePage() {
  const game = useGameState();
  const [showResult, setShowResult] = useState(false);
  const [wheelSize, setWheelSize] = useState(460);
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

  const handleSpin = useCallback(() => {
    const result = game.executeSpin();
    if (!result) return;

    // Use setTimeout so React state updates don't interrupt the scroll computation
    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [game]);

  const handleSpinComplete = useCallback(() => {
    game.resolveResult();
    setShowResult(true);
  }, [game]);

  const handleDismissResult = useCallback(() => {
    setShowResult(false);
    game.startNewRound();
  }, [game]);

  const cycle = useGameCycle({
    phase: game.phase,
    setPhase: game.setPhase,
    executeSpin: handleSpin,
    startNewRound: game.startNewRound,
  });

  const isBettingDisabled = game.phase !== 'BETTING';
  const playerTag = 'Player_672634';

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
      className="flex flex-col h-screen overflow-hidden select-none"
      style={{
        background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)`,
      }}
    >
      {/* Top Bar / Player card */}
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
          <div
            className="flex flex-col px-4 py-2 rounded border-2"
            style={{
              background: 'linear-gradient(135deg, #2a2a2a, #111)',
              borderColor: '#c9a44c',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <p className="text-[13px] md:text-sm font-semibold" style={{ color: '#fff', fontFamily: 'var(--font-inter)' }}>
                {playerTag}
              </p>
            </div>
            <p className="text-sm md:text-base font-bold pl-8" style={{ fontFamily: 'var(--font-playfair)', color: '#c9a44c' }}>
              ${game.balance.toLocaleString()}
            </p>
          </div>
        </div>
      </header>

      <div className="mobile-rotate-warning">
        <div className="mobile-rotate-card">
          <p className="mobile-rotate-title">Rotate Device</p>
          <p className="mobile-rotate-text">This game is designed for landscape mode on mobile.</p>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="mobile-game-content mobile-landscape-main flex-1 relative px-1.5 md:px-2 lg:px-3 py-2 overflow-y-auto overflow-x-hidden">
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
          <h2 className="text-sm font-semibold mb-2 text-[#c9a44c] uppercase tracking-wider text-center" style={{ fontFamily: 'var(--font-playfair)' }}>Hot Numbers</h2>
          <div className="space-y-2">
            {luckyNumbers.length === 0 ? (
              <p className="text-xs text-white/50 text-center italic">Spin to populate stats</p>
            ) : (
              luckyNumbers.map((entry) => (
                <div key={entry.display} className="grid grid-cols-[30px_1fr_48px] items-center gap-2">
                  <span className="text-sm font-bold text-white text-center">{entry.display}</span>
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#c9a44c] to-[#e4c97b]" style={{ width: `${entry.hitRate}%` }} />
                  </div>
                  <span className="text-[11px] text-right text-white/80 font-mono">{entry.hitRate.toFixed(1)}%</span>
                </div>
              ))
            )}
          </div>
        </motion.aside>

        <div className="mobile-landscape-shell mx-auto w-full max-w-[1400px] pt-4 md:pt-6 lg:pt-8 bg-black/10 rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] border border-white/5 my-2">
          <div className="mobile-landscape-row flex flex-col md:flex-row items-start gap-4 md:gap-4 lg:gap-6 px-4 pb-4">
            {/* Wheel — responsive container */}
            <motion.div
              ref={wheelRef}
              initial={{ opacity: 0, y: 22, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="mobile-landscape-wheel flex flex-col items-center gap-2 flex-1 min-w-0 max-w-[760px] md:max-w-[520px] lg:max-w-[760px]"
            >
              <div className="w-full origin-center">
                <RouletteWheel
                  wheelType={game.wheelType}
                  spinResult={game.currentResult}
                  isSpinning={game.phase === 'SPINNING'}
                  onSpinComplete={handleSpinComplete}
                  size={wheelSize}
                />
              </div>

              {/* Wheel type toggle */}
              <div
                className="flex items-center gap-2 text-xs"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <button
                  onClick={() => game.setWheelType('american')}
                  className="px-3 py-1 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: game.wheelType === 'american' ? COLORS.gold + '20' : 'transparent',
                    color: game.wheelType === 'american' ? COLORS.gold : '#c2d7d5',
                    border: `1px solid ${game.wheelType === 'american' ? COLORS.gold + '40' : 'transparent'}`,
                  }}
                >
                  American
                </button>
                <button
                  onClick={() => game.setWheelType('european')}
                  className="px-3 py-1 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: game.wheelType === 'european' ? COLORS.gold + '20' : 'transparent',
                    color: game.wheelType === 'european' ? COLORS.gold : '#c2d7d5',
                    border: `1px solid ${game.wheelType === 'european' ? COLORS.gold + '40' : 'transparent'}`,
                  }}
                >
                  European
                </button>
              </div>
            </motion.div>

            {/* Right stack with board + stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              className="mobile-landscape-right w-full md:w-[420px] lg:w-[470px] md:flex-shrink-0"
            >
              <div className="w-full rounded-md border p-1.5 overflow-hidden relative" style={{ background: '#2b8673', borderColor: '#5ea896', borderWidth: '2px' }}>
                <AnimatePresence>
                  {game.phase === 'LOCKED' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] bg-black/40"
                    >
                      <div className="px-6 py-3 rounded-lg border-2" style={{
                        background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.95), rgba(139, 107, 34, 0.95))',
                        borderColor: '#fcefa3',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                      }}>
                        <h2 className="text-xl md:text-3xl font-black text-white tracking-widest drop-shadow-md" style={{ fontFamily: 'var(--font-playfair)' }}>
                          BETS CLOSED
                        </h2>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  style={{
                    transform: 'scale(0.82)',
                    transformOrigin: 'top left',
                    width: '122%',
                  }}
                >
                  <BettingLayout
                    bets={game.bets}
                    onPlaceBet={game.placeBet}
                    onRemoveBet={game.removeBet}
                    disabled={isBettingDisabled}
                    winningResult={game.currentResult}
                    payoutResult={game.lastPayout}
                    showWinHighlight={game.phase === 'RESULT'}
                    phase={game.phase}
                  />
                </div>
              </div>

              {/* Action row with Timer and Spin */}
              <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={game.rebetLastRound}
                    disabled={isBettingDisabled}
                    className="text-xs px-3 py-1 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      color: '#f4f8fa',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.08)',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    Rebet
                  </button>

                  {game.totalBet > 0 && game.phase === 'BETTING' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={game.clearBets}
                        className="text-xs px-3 py-1 rounded cursor-pointer transition-colors"
                        style={{
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.28)',
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        Clear
                      </button>
                    </motion.div>
                  )}
                </div>

                {game.phase === 'BETTING' && (
                  <BettingTimer timeRemaining={cycle.timeRemaining} />
                )}

                {game.phase === 'LOCKED' && (
                  <SpinButton
                    onClick={handleSpin}
                    disabled={false}
                    isSpinning={false}
                  />
                )}
              </div>

              <motion.aside
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="w-full rounded border overflow-hidden mt-4"
                style={{
                  background: 'linear-gradient(180deg, #2a0b15 0%, #150208 100%)',
                  borderColor: '#c9a44c',
                  borderWidth: '1px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-center text-xs md:text-sm font-bold uppercase tracking-widest py-2.5 shadow-md" style={{ background: 'linear-gradient(to right, #1d4033, #2a5a48, #1d4033)', color: '#f0f6ff', borderBottom: '1px solid rgba(201, 164, 76, 0.4)', fontFamily: 'var(--font-playfair)' }}>Your Session Stats</div>
                <div className="space-y-2 text-white/90 text-xs md:text-sm p-4" style={{ fontFamily: 'var(--font-inter)' }}>
                  <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/60">Last Win</span><span className="font-mono text-[#c9a44c]">${game.sessionStats.lastWin}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/60">Last Bets</span><span className="font-mono">${game.sessionStats.lastBets}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/60">Net Last Win</span><span className="font-mono" style={{ color: game.sessionStats.netLastWin >= 0 ? '#4ade80' : '#f87171' }}>{game.sessionStats.netLastWin >= 0 ? '+' : ''}${game.sessionStats.netLastWin}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/60">Session Win</span><span className="font-mono" style={{ color: game.sessionStats.sessionWin >= 0 ? '#4ade80' : '#f87171' }}>{game.sessionStats.sessionWin >= 0 ? '+' : ''}${game.sessionStats.sessionWin}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-white/60">Hit Percent</span><span className="font-mono">{game.sessionStats.hitPercent.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-white/60">Miss Percent</span><span className="font-mono text-white/50">{game.sessionStats.missPercent.toFixed(1)}%</span></div>
                </div>
              </motion.aside>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Chip Tray */}
      <ChipTray
        selectedChip={game.selectedChip}
        onSelectChip={game.setSelectedChip}
        balance={game.balance}
        totalBet={game.totalBet}
        disabled={isBettingDisabled}
      />

      {/* Result Overlay */}
      <ResultDisplay
        result={game.currentResult}
        payout={game.lastPayout}
        visible={showResult}
        onDismiss={handleDismissResult}
      />
    </div>
  );
}
