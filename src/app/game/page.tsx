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
import { motion } from 'framer-motion';
import RouletteWheel from '@/components/table/RouletteWheel';
import BettingLayout from '@/components/table/BettingLayout';
import ChipTray from '@/components/chips/ChipTray';
import SpinButton from '@/components/ui/SpinButton';
import ResultDisplay from '@/components/ui/ResultDisplay';
import SpinHistory from '@/components/ui/SpinHistory';
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

  const isBettingDisabled = game.phase !== 'betting';
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
        background: `
          radial-gradient(ellipse at top left, #2dc8c140 0%, transparent 40%),
          radial-gradient(ellipse at top right, #ef5cae33 0%, transparent 42%),
          linear-gradient(180deg, #11656d 0%, #083b40 45%, #08272d 100%)
        `,
      }}
    >
      {/* Top Bar / Player card */}
      <header
        className="flex items-center justify-between px-4 lg:px-6 py-3 z-10 gap-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(8, 42, 47, 0.95), rgba(8, 42, 47, 0.75))',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
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
            className="px-3 py-2 rounded-md border"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 60, 65, 0.9), rgba(5, 30, 35, 0.9))',
              borderColor: 'rgba(201, 168, 76, 0.4)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: '#a0babc', fontFamily: 'var(--font-inter)' }}>
              {playerTag}
            </p>
            <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
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
          className="w-full max-w-[230px] md:max-w-[250px] rounded-lg border p-2 h-fit md:absolute md:left-1 md:top-2 z-20"
          style={{
            background: 'linear-gradient(180deg, rgba(250,235,218,0.95) 0%, rgba(235,216,194,0.92) 100%)',
            borderColor: 'rgba(80, 60, 40, 0.18)',
          }}
        >
          <h2 className="text-sm font-semibold mb-2 text-[#53423b]">How Lucky Are Last Five Numbers?</h2>
          <div className="space-y-2">
            {luckyNumbers.length === 0 ? (
              <p className="text-xs text-[#6f5a52]">Spin a few rounds to populate lucky stats.</p>
            ) : (
              luckyNumbers.map((entry) => (
                <div key={entry.display} className="grid grid-cols-[30px_1fr_48px] items-center gap-2">
                  <span className="text-sm font-bold text-[#352a27]">{entry.display}</span>
                  <div className="h-3 rounded-full bg-black/15 overflow-hidden">
                    <div className="h-full rounded-full bg-[#e95d85]" style={{ width: `${entry.hitRate}%` }} />
                  </div>
                  <span className="text-[11px] text-right text-[#5e4b45]">{entry.hitRate.toFixed(1)}%</span>
                </div>
              ))
            )}
          </div>
        </motion.aside>

        <div className="mobile-landscape-shell mx-auto w-full max-w-[1360px] pt-2 md:pt-8 lg:pt-10">
          <div className="mobile-landscape-row flex flex-col md:flex-row items-start gap-2 md:gap-2 lg:gap-3">
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
                  isSpinning={game.phase === 'spinning'}
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
              <div className="w-full rounded-md border p-1.5 overflow-hidden" style={{ background: 'rgba(8, 45, 49, 0.55)', borderColor: 'rgba(255,255,255,0.18)' }}>
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
                    showWinHighlight={game.phase === 'result'}
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
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

                {game.totalBet > 0 && game.phase === 'betting' && (
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

                <SpinButton
                  onClick={handleSpin}
                  disabled={game.totalBet === 0 || isBettingDisabled}
                  isSpinning={game.phase === 'spinning'}
                />
              </div>

              <motion.aside
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="w-full rounded-lg border p-3 h-fit mt-2"
                style={{
                  background: 'linear-gradient(180deg, rgba(112,15,54,0.7) 0%, rgba(62,6,31,0.78) 100%)',
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <p className="text-center text-sm mb-2 uppercase tracking-widest text-[#b8e8d0]">Your Session Stats</p>
                <div className="space-y-1.5 text-[#f0f6ff] text-sm">
                  <div className="flex justify-between"><span>Last Win</span><span>{game.sessionStats.lastWin}</span></div>
                  <div className="flex justify-between"><span>Last Bets</span><span>{game.sessionStats.lastBets}</span></div>
                  <div className="flex justify-between"><span>Net Last Win</span><span>{game.sessionStats.netLastWin}</span></div>
                  <div className="flex justify-between"><span>Session Win</span><span>{game.sessionStats.sessionWin}</span></div>
                  <div className="flex justify-between"><span>Hit Percent</span><span>{game.sessionStats.hitPercent.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>Miss Percent</span><span>{game.sessionStats.missPercent.toFixed(1)}%</span></div>
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
