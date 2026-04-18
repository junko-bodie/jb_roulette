'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouletteWheel from './RouletteWheel';
import BettingLayout from './BettingLayout';
import BettingControlButtons from '@/components/ui/BettingControlBar';
import { type WheelType, type SpinResult } from '@/lib/rng';
import { type PlacedBet } from '@/lib/bets';
import { type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';
import type React from 'react';

import { useGame } from '@/context/GameContext';
import BetTimer from '@/components/ui/BetTimer';

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
}

export default function RouletteTable({
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
    <div className="mx-auto w-full max-w-[1500px]">
      {/* THE FOAM BUFFER — Unified for both wheel and table */}
      <div
        className="relative p-3 sm:p-5 md:p-6 rounded-[40px] shadow-[0_30px_80px_rgba(0,0,0,0.9)] w-full overflow-hidden mobile-foam-compact"
        style={{
          background: '#2d1a10', // Rich leather brown
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.3) 100%),
            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 80%)
          `,
          border: '5px solid #1a0f09',
          boxShadow: `
            inset 0 15px 30px rgba(255,255,255,0.08), 
            inset 0 -15px 30px rgba(0,0,0,0.8),
            0 25px 50px rgba(0,0,0,1)
          `,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Inner seam line */}
        <div
          className="absolute inset-[16px] rounded-[24px] border-2 border-black/30 pointer-events-none"
          style={{
            zIndex: 1,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
          }}
        />

        {/* The green felt area — Unified horizontal row */}
        <div
          className="relative rounded-2xl border-4 overflow-hidden flex flex-row items-center justify-start gap-3 md:gap-4 lg:gap-6 mobile-felt-stack"
          style={{
            background: 'rgba(10, 35, 29, 1)', // Dark casino green
            borderColor: '#11352e',
            padding: '1rem 1.5rem 1rem 0.5rem',
            zIndex: 2,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Wheel Section (Left) */}
          <motion.div
            ref={wheelRef}
            className="relative flex justify-center items-center flex-1 mobile-wheel-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isMobile 
              ? { opacity: 1, scale: 1, y: 0 } 
              : { opacity: 1, scale: 1, y: -25 }
            }
          >
            <RouletteWheel
              wheelType={wheelType}
              spinResult={currentResult}
              isSpinning={isSpinning}
              onSpinComplete={onSpinComplete}
              size={wheelSize}
            />

            {/* Wheel type toggle — overlaid at bottom center of wheel */}
            <div
              className="absolute flex items-center gap-2 text-[13px] z-30"
              style={{
                fontFamily: 'var(--font-inter)',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                borderRadius: '9999px',
                padding: '5px 10px',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(201, 164, 76, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              <button
                onClick={() => setWheelType('american')}
                className="px-6 py-2 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  background: wheelType === 'american' ? '#c9a84c60' : 'transparent',
                  color: wheelType === 'american' ? '#f4fbfb' : '#c2d7d580',
                  fontWeight: 'bold',
                }}
              >
                American
              </button>
              <button
                onClick={() => setWheelType('european')}
                className="px-6 py-2 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  background: wheelType === 'european' ? '#c9a84c60' : 'transparent',
                  color: wheelType === 'european' ? '#f4fbfb' : '#c2d7d580',
                  fontWeight: 'bold',
                }}
              >
                European
              </button>
            </div>
          </motion.div>

          {/* Table Section (Right) */}
          <motion.div
            className="flex-[2] flex flex-col items-center justify-center p-2 mobile-table-section w-full"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={isMobile
              ? { opacity: 1, x: 0, scale: 1 }
              : { opacity: 1, x: 0.5, scaleX: 1.1, scaleY: 1.55 }
            }
            transition={{ duration: 0.5 }}
          >
            {/* Junko Bodie Title — above the betting grid */}
            <div className="flex flex-col items-center mb-0.5 -mt-2" style={{ transform: 'scaleX(0.977) scaleY(0.69)' }}>
              <h1
                className="text-2xl md:text-3xl tracking-wider"
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
              <div className="flex items-center gap-2 -mt-0.5">
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

            {/* ═══ BUTTONS — directly below betting grid ═══ */}
            <div
              className="flex items-center justify-end gap-3 mt-2 w-full pr-8"
              style={{ transform: 'scaleX(0.78) scaleY(0.645)' }}
            >
              {/* Timer UI - only show if betting and timer enabled */}
              <div className="flex flex-col items-center justify-center mr-4">
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
                <>
                  <BettingControlButtons
                    totalBet={totalBet}
                    balance={balance}
                    onDouble={onDoubleAllBets || (() => false)}
                    onToggleDelete={onToggleDeleteMode || (() => { })}
                    deleteMode={deleteMode}
                    disabled={isBettingDisabled}
                  />
                  <div style={{ width: '1px', height: '24px', background: '#5ea896', opacity: 0.3 }} />
                </>
              )}

              {/* RESET — compact bordered box */}
              <button
                onClick={onRebet}
                disabled={!canBet || !hasLastSpin}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: '#d4d0c4',
                  background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                  border: '2px solid #5ea896',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  lineHeight: 1,
                }}
              >
                Reset
              </button>

              {/* CLEAR — compact bordered box (clears all bets) */}
              <button
                onClick={handleClearBetsClick}
                disabled={!canBet || !hasBets}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: '#d4d0c4',
                  background: 'linear-gradient(180deg, #2a3a2e 0%, #1a1a1a 100%)',
                  border: '2px solid #5ea896',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  lineHeight: 1,
                }}
              >
                Clear
              </button>

              {/* CLEAR LAST BET — compact bordered box with sub-label */}
              <button
                onClick={handleClearLastBetClick}
                disabled={!canBet || !hasBets}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: '#d4d0c4',
                  background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                  border: '2px solid #5ea896',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  lineHeight: 1,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>Clear</span>
                <span style={{ fontSize: '7px', opacity: 0.6, letterSpacing: '0.05em' }}>LAST BET</span>
              </button>

              {/* SPIN — dark green oval with thick gold border */}
              {/* SPIN — dark green oval with thick gold border */}
              <motion.button
                onClick={handleSpinClick}
                disabled={!spinEnabled}
                whileHover={spinEnabled ? { scale: 1.06, y: -1 } : {}}
                whileTap={spinEnabled ? { scale: 1.12, y: 1 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative overflow-hidden cursor-pointer disabled:cursor-not-allowed ml-1"
                style={{
                  background: spinEnabled
                    ? 'linear-gradient(180deg, #1e5a3a 0%, #0f3d28 40%, #0a2e1e 100%)'
                    : 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                  color: spinEnabled ? '#ffffff' : '#444',
                  fontFamily: "'Bodoni Moda', serif",
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase' as const,
                  padding: '10px 34px',
                  borderRadius: '9999px',
                  borderWidth: spinEnabled ? '4px' : '2px',
                  borderStyle: 'solid',
                  borderColor: spinEnabled ? '#c9a44c' : '#333',
                  boxShadow: spinEnabled
                    ? `0 0 0 2px #1a0f09, 0 6px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4), 0 0 30px rgba(201, 168, 76, 0.3)`
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}