import React, { useRef, useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouletteWheel from './RouletteWheel';
import BettingLayout from './BettingLayout';
import BettingControlButtons from '@/components/ui/BettingControlBar';
import { type WheelType, type SpinResult } from '@/lib/rng';
import { type PlacedBet } from '@/lib/bets';
import { type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';

import { useGame } from '@/context/GameContext';
import BetTimer from '@/components/ui/BetTimer';
import TournamentRules from '@/components/tournament/TournamentRules';

interface RouletteTableProps {
  wheelType: WheelType;
  currentResult: SpinResult | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
  wheelSize: number;
  wheelRef: React.RefObject<HTMLDivElement | null>;
  bets: Map<string, PlacedBet>;
  onPlaceBet: (betId: string) => void;
  onRemoveBet: (betId: string) => void;
  isBettingDisabled: boolean;
  lastPayout: PayoutResult | null;
  phase: string;
  setWheelType: (type: WheelType) => void;
  // Button action props
  onSpin: () => void;
  onRebet: () => void;
  onClearBets: () => void;
  onClearLastBet: () => void;
  hasLastSpin: boolean;
  // Advanced betting props
  balance?: number;
  totalBet?: number;
  onDoubleAllBets?: () => boolean;
  onToggleDeleteMode?: () => void;
  deleteMode?: boolean;
  onPopLastChip?: (betId: string) => void;
  onClearZone?: (betId: string) => void;
  onTimeout?: () => void;
  tournamentMode?: boolean;
  myBets?: Map<string, PlacedBet>;
}

const RouletteTable = memo(function RouletteTable({
  wheelType,
  currentResult,
  isSpinning,
  onSpinComplete,
  wheelSize,
  wheelRef,
  bets,
  onPlaceBet,
  onRemoveBet,
  isBettingDisabled,
  lastPayout,
  phase,
  setWheelType,
  onSpin,
  onRebet,
  onClearBets,
  onClearLastBet,
  hasLastSpin,
  balance = 0,
  totalBet = 0,
  onDoubleAllBets,
  onToggleDeleteMode,
  deleteMode = false,
  onPopLastChip,
  onClearZone,
  onTimeout,
  tournamentMode = false,
  myBets,
}: RouletteTableProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { isSoundEnabled, isTimerEnabled } = useGame();

  const handleSpinClick = () => {
    if (soundEngine) soundEngine.playSpinClick();
    onSpin();
  };

  const handleClearBetsClick = () => {
    if (soundEngine) soundEngine.playSwoosh();
    onClearBets();
  };

  const handleClearLastBetClick = () => {
    if (soundEngine) soundEngine.playSwoosh();
    onClearLastBet();
  };

  const handlePopLastChip = (betId: string) => {
    if (soundEngine) soundEngine.playSwoosh();
    onPopLastChip?.(betId);
  };

  const handleClearZone = (betId: string) => {
    if (soundEngine) soundEngine.playSwoosh();
    onClearZone?.(betId);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const canBet = !isSpinning && phase === 'BETTING';
  const isLocked = phase === 'LOCKED';
  const hasBets = bets.size > 0;
  const spinEnabled = canBet && hasBets;

  return (
    <div className="mx-auto w-full h-full flex flex-col">
      {/* THE FOAM BUFFER — Unified for both wheel and table */}
      <div
        className="relative p-0 sm:p-1 md:p-2 rounded-none sm:rounded-[12px] md:rounded-[20px] shadow-[0_40px_100px_rgba(0,0,0,1)] w-full flex-1 md:h-full overflow-visible md:overflow-hidden"
        style={{
          background: '#06140e',
          border: isMobile ? 'none' : '3px solid #080808',
          boxShadow: `
            inset 0 2px 5px rgba(255,255,255,0.03),
            inset 0 -10px 20px rgba(0,0,0,0.6),
            0 30px 60px rgba(0,0,0,0.8)
          `,
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Brushed Gold Inner Frame */}
        <div
          className="absolute rounded-none sm:rounded-[8px] md:rounded-[14px] border-[1px] sm:border-[1.5px] md:border-[2px] border-[#c9a44c]/20 pointer-events-none"
          style={{
            inset: isMobile ? '0' : '6px',
            zIndex: 1,
            boxShadow: 'inset 0 0 10px rgba(201, 164, 76, 0.1), 0 0 6px rgba(0,0,0,0.3)'
          }}
        />

        {/* The green felt area — VIP Emerald Edition */}
        <div
          className="relative rounded-none sm:rounded-[8px] md:rounded-[14px] border-b-2 border-black/30 flex flex-row items-center justify-start sm:justify-center gap-0 md:gap-2 lg:gap-4 mobile-felt-stack h-full md:h-full w-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #0d2e23 0%, #051410 100%)',
            padding: isMobile ? '0 0.5rem 0 0' : '0 2rem 0 0',
            zIndex: 2,
            boxShadow: `
              inset 0 0 60px rgba(0,0,0,0.6),
              inset 0 8px 20px rgba(0,0,0,0.4)
            `,
            flex: 1
          }}
        >
          {/* Wheel Section (Left) */}
          <motion.div
            ref={wheelRef}
            className="relative flex justify-center items-center mobile-wheel-section"
            initial={{ opacity: 0, scale: 0.95, flex: 1 }}
            animate={isMobile
              ? { opacity: 1, scale: isSpinning ? 1.1 : 1, y: 0, flex: 'none' }
              : {
                opacity: 1,
                scale: isSpinning ? 1.15 : 1,
                y: isSpinning ? 0 : -25,
                flex: isSpinning ? 4 : 1
              }
            }
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <RouletteWheel
              wheelType={wheelType}
              spinResult={currentResult}
              isSpinning={isSpinning}
              onSpinComplete={onSpinComplete}
              size={wheelSize}
            />

            {/* Wheel type toggle — overlaid at bottom center of wheel */}
            {!tournamentMode && (
              <div
                className="absolute flex items-center gap-1 sm:gap-2 z-30"
                style={{
                  fontFamily: 'var(--font-inter)',
                  bottom: isMobile ? '-10px' : '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: '9999px',
                  padding: isMobile ? '3px 6px' : '5px 10px',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(201, 164, 76, 0.4)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                  opacity: isSpinning ? 0 : (isBettingDisabled ? 0.5 : 1),
                  pointerEvents: isSpinning || isBettingDisabled ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease',
                  fontSize: isMobile ? '10px' : '13px',
                }}
              >
                <button
                  onClick={() => setWheelType('american')}
                  className="rounded-full transition-all duration-300 cursor-pointer flex-1 text-center"
                  style={{
                    padding: isMobile ? '3px 8px' : '10px 32px',
                    background: wheelType === 'american'
                      ? 'linear-gradient(180deg, #c9a44c 0%, #a68434 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: wheelType === 'american' ? '#000' : '#c2d7d580',
                    fontWeight: 900,
                    fontSize: isMobile ? '9px' : '14px',
                    letterSpacing: '0.05em',
                    border: '2px solid',
                    borderColor: wheelType === 'american' ? '#f5edd5' : 'transparent',
                    boxShadow: wheelType === 'american'
                      ? '0 0 20px rgba(201, 164, 76, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                      : 'none',
                    textTransform: 'uppercase'
                  }}
                >
                  American
                </button>
                <button
                  onClick={() => setWheelType('european')}
                  className="rounded-full transition-all duration-300 cursor-pointer flex-1 text-center"
                  style={{
                    padding: isMobile ? '3px 8px' : '10px 32px',
                    background: wheelType === 'european'
                      ? 'linear-gradient(180deg, #c9a44c 0%, #a68434 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: wheelType === 'european' ? '#000' : '#c2d7d580',
                    fontWeight: 900,
                    fontSize: isMobile ? '9px' : '14px',
                    letterSpacing: '0.05em',
                    border: '2px solid',
                    borderColor: wheelType === 'european' ? '#f5edd5' : 'transparent',
                    boxShadow: wheelType === 'european'
                      ? '0 0 20px rgba(201, 164, 76, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                      : 'none',
                    textTransform: 'uppercase'
                  }}
                >
                  European
                </button>
              </div>
            )}
          </motion.div>

          {/* Table Section (Right) */}
          <motion.div
            className="flex flex-col items-center justify-start p-0.5 sm:p-2 mobile-table-section"
            initial={{ opacity: 0, x: 20, scale: 0.95, width: '100%' }}
            animate={isMobile
              ? { opacity: isSpinning ? 0 : 1, scale: isSpinning ? 0.9 : 1, y: 0, width: isSpinning ? '0%' : '100%', overflow: isSpinning ? 'hidden' : 'visible' }
              : {
                opacity: isSpinning ? 0 : 1,
                x: 1,
                scaleX: isSpinning ? 0.5 : 1.08,
                scaleY: isSpinning ? 0.5 : 1.5,
                width: isSpinning ? '0%' : '100%',
                overflow: isSpinning ? 'hidden' : 'visible'
              }
            }
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Junko Bodie Title & Tournament Rules */}
            <div className="hidden md:flex flex-col items-center mb-0.5 -mt-32" style={{ transform: 'scaleX(0.977) scaleY(0.69)' }}>
              <h1
                className="text-3xl md:text-5xl tracking-wider"
                style={{
                  fontFamily: "'Bodoni Moda', serif",
                  fontStyle: 'italic',
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  background: 'linear-gradient(180deg, #f5edd5, #c9a44c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}
              >
                JUNKO BODIE
              </h1>
              <div className="flex items-center gap-2 -mt-0.5 mb-2">
                <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                <span
                  className="text-[9px] uppercase tracking-[0.4em]"
                  style={{
                    color: 'rgba(201, 164, 76, 0.5)',
                    fontFamily: "'Bodoni Moda', serif",
                    fontWeight: 700,
                  }}
                >
                  Roulette
                </span>
                <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
              </div>

              {tournamentMode && <TournamentRules />}
            </div>

            {/* Betting Grid Section with Blur & Overlay */}
            <div className="w-full relative">
              <div
                className="transition-all duration-700"
                style={{ filter: isLocked || isSpinning ? 'blur(8px)' : 'none' }}
              >
                <BettingLayout
                  bets={bets}
                  onPlaceBet={onPlaceBet}
                  onRemoveBet={onRemoveBet}
                  disabled={isBettingDisabled || isLocked}
                  winningResult={currentResult}
                  payoutResult={lastPayout}
                  showWinHighlight={!!currentResult && !isSpinning}
                  phase={phase}
                  deleteMode={deleteMode}
                  onPopLastChip={handlePopLastChip}
                  onClearZone={handleClearZone}
                  wheelType={wheelType}
                  myBets={myBets}
                />
              </div>

              {/* BETS CLOSED Overlay */}
              <AnimatePresence>
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                  >
                    <div
                      className="px-8 py-4 rounded-xl border-4 border-[#c9a44c] bg-black/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2"
                      style={{ transform: 'rotate(-5deg)' }}
                    >
                      <span className="text-4xl font-black text-white tracking-[0.2em] italic" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                        BETS CLOSED
                      </span>
                      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
                      <span className="text-[10px] text-[#c9a44c] uppercase tracking-[0.4em] font-bold">Good Luck</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ═══ BUTTONS — directly below betting grid (hidden in tournament mode) ═══ */}
            {!tournamentMode && (
              <div
                className={`flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 md:gap-6 mt-2 sm:mt-4 md:mt-10 mb-1 sm:mb-3 md:mb-4 w-full pr-1 sm:pr-2 md:pr-6`}
                style={{ transform: 'scaleX(1.0) scaleY(1.0)' }}
              >
                {/* Timer UI - only show if betting and timer enabled */}
                <div className="flex flex-col items-center justify-center mr-2 sm:mr-6">
                  {isTimerEnabled && !isSpinning && phase === 'BETTING' && (
                    <BetTimer
                      duration={45}
                      isActive={!isSpinning && phase === 'BETTING'}
                      onTimeout={() => {
                        if (onTimeout) {
                          onTimeout();
                        } else if (hasBets && !isSpinning) {
                          handleSpinClick();
                        }
                      }}
                    />
                  )}
                </div>

                {/* 2X and Delete Mode Buttons — Left Side */}
                {!isBettingDisabled && totalBet > 0 && (
                  <div className="flex items-center gap-2 sm:gap-4 mr-1 sm:mr-2">
                    <BettingControlButtons
                      totalBet={totalBet}
                      balance={balance}
                      onDouble={onDoubleAllBets || (() => false)}
                      onToggleDelete={onToggleDeleteMode || (() => { })}
                      deleteMode={deleteMode}
                      disabled={isBettingDisabled}
                    />
                    <div style={{ width: '1px', height: '24px', background: '#5ea896', opacity: 0.3 }} />
                  </div>
                )}

                {/* RE-BET — compact bordered box */}
                <button
                  onClick={onRebet}
                  disabled={!canBet || !hasLastSpin}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: isMobile ? '14px' : '13px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: '#e4e0d4',
                    background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                    border: isMobile ? '2.5px solid #c9a44c' : '3px solid #c9a44c',
                    borderRadius: '10px',
                    padding: isMobile ? '12px 22px' : '12px 22px',
                    lineHeight: 1,
                    boxShadow: '0 4px 0 #1a0f09, 0 8px 15px rgba(0,0,0,0.5)',
                  }}
                >
                  RE-BET
                </button>

                {/* CLEAR — compact bordered box (clears all bets) */}
                <button
                  onClick={handleClearBetsClick}
                  disabled={!canBet || !hasBets}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: isMobile ? '14px' : '13px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: '#e4e0d4',
                    background: 'linear-gradient(180deg, #2a3a2e 0%, #1a1a1a 100%)',
                    border: isMobile ? '2.5px solid #c9a44c' : '3px solid #c9a44c',
                    borderRadius: '10px',
                    padding: isMobile ? '12px 22px' : '12px 22px',
                    lineHeight: 1,
                    boxShadow: '0 4px 0 #1a0f09, 0 8px 15px rgba(0,0,0,0.5)',
                  }}
                >
                  Clear
                </button>

                {/* UNDO — compact bordered box */}
                <button
                  onClick={handleClearLastBetClick}
                  disabled={!canBet || !hasBets}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: isMobile ? '14px' : '13px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: '#e4e0d4',
                    background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                    border: isMobile ? '2.5px solid #c9a44c' : '3px solid #c9a44c',
                    borderRadius: '10px',
                    padding: isMobile ? '12px 22px' : '12px 22px',
                    lineHeight: 1,
                    boxShadow: '0 4px 0 #1a0f09, 0 8px 15px rgba(0,0,0,0.5)',
                  }}
                >
                  UNDO
                </button>

                {/* SPIN — dark green oval with thick gold 3D border */}
                <motion.button
                  onClick={handleSpinClick}
                  disabled={!spinEnabled}
                  whileHover={spinEnabled ? { scale: 1.05, y: -2 } : {}}
                  whileTap={spinEnabled ? {
                    scale: 0.98,
                    y: 4,
                    boxShadow: `0 2px 0 0 #1a0f09, 0 4px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)`
                  } : {}}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="relative overflow-hidden cursor-pointer disabled:cursor-not-allowed ml-1 sm:ml-4 mt-2 mb-2"
                  style={{
                    background: spinEnabled
                      ? 'linear-gradient(180deg, #1e5a3a 0%, #0f3d28 40%, #0a2e1e 100%)'
                      : 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                    color: spinEnabled ? '#ffffff' : '#444',
                    fontFamily: "'Bodoni Moda', serif",
                    fontStyle: 'italic',
                    fontWeight: 900,
                    fontSize: isMobile ? '1.15rem' : '1.1rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    padding: isMobile ? '14px 36px' : '14px 48px',
                    borderRadius: '9999px',
                    borderWidth: spinEnabled ? '3px' : '2px',
                    borderStyle: 'solid',
                    borderColor: spinEnabled ? '#f5edd5' : '#333',
                    boxShadow: spinEnabled
                      ? `0 8px 0 0 #1a0f09, 0 12px 25px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -5px 0 rgba(0,0,0,0.3), 0 0 40px rgba(201, 168, 76, 0.3)`
                      : 'none',
                    textShadow: spinEnabled ? '0 2px 4px rgba(0,0,0,0.6)' : 'none',
                  } as React.CSSProperties}
                >
                  {/* Shimmer overlay */}
                  {spinEnabled && !isSpinning && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)',
                        backgroundSize: '200% 100%',
                        borderRadius: '9999px',
                      } as React.CSSProperties}
                      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                    />
                  )}
                  <span className="relative z-10">
                    {isSpinning ? 'Spinning...' : 'SPIN'}
                  </span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
});

export default RouletteTable;