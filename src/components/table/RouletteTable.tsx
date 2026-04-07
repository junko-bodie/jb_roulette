'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import RouletteWheel from './RouletteWheel';
import BettingLayout from './BettingLayout';
import { type WheelType, type SpinResult } from '@/lib/rng';
import { type PlacedBet } from '@/lib/bets';
import { type PayoutResult } from '@/lib/payouts';
import type React from 'react';

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
}: RouletteTableProps) {
  const canBet = !isSpinning && phase === 'BETTING';
  const hasBets = bets.size > 0;
  const spinEnabled = canBet && hasBets;

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* THE FOAM BUFFER — Unified for both wheel and table */}
      <div
        className="relative p-8 sm:p-12 rounded-[50px] shadow-[0_40px_100px_rgba(0,0,0,0.9)] w-full overflow-hidden mobile-foam-compact"
        style={{
          background: '#2d1a10', // Rich leather brown
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.3) 100%),
            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 80%)
          `,
          border: '6px solid #1a0f09',
          boxShadow: `
            inset 0 20px 40px rgba(255,255,255,0.08), 
            inset 0 -20px 40px rgba(0,0,0,0.8),
            0 30px 60px rgba(0,0,0,1)
          `,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Inner seam line */}
        <div
          className="absolute inset-[24px] rounded-[30px] border-2 border-black/40 pointer-events-none"
          style={{
            zIndex: 1,
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9)'
          }}
        />

        {/* The green felt area — Unified horizontal row */}
        <div
          className="relative rounded-2xl border-4 overflow-hidden flex flex-row items-center justify-start gap-8 mobile-felt-stack"
          style={{
            background: 'rgba(10, 35, 29, 1)', // Dark casino green
            borderColor: '#11352e',
            padding: '2rem 3rem 2rem 0.5rem',
            zIndex: 2,
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)',
            minHeight: '560px'
          }}
        >
          {/* Wheel Section (Left) */}
          <motion.div
            ref={wheelRef}
            className="relative flex justify-center items-center flex-1 mobile-wheel-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
              className="absolute flex items-center gap-1 text-[10px] z-30"
              style={{
                fontFamily: 'var(--font-inter)',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '12px',
                padding: '3px 8px',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(201, 164, 76, 0.3)'
              }}
            >
              <button
                onClick={() => setWheelType('american')}
                className="px-3 py-1 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  background: wheelType === 'american' ? '#c9a84c40' : 'transparent',
                  color: wheelType === 'american' ? '#f4fbfb' : '#c2d7d580',
                  fontWeight: wheelType === 'american' ? 'bold' : 'normal',
                }}
              >
                American
              </button>
              <button
                onClick={() => setWheelType('european')}
                className="px-3 py-1 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  background: wheelType === 'european' ? '#c9a84c40' : 'transparent',
                  color: wheelType === 'european' ? '#f4fbfb' : '#c2d7d580',
                  fontWeight: wheelType === 'european' ? 'bold' : 'normal',
                }}
              >
                European
              </button>
            </div>
          </motion.div>

          {/* Table Section (Right) */}
          <motion.div
            className="flex-[2] flex flex-col items-center justify-center p-2 mobile-table-section"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0.5, scaleX: 1.14, scaleY: 1.55 }}
            transition={{ duration: 0.5 }}
          >
            {/* Junko Bodie Title — above the betting grid */}
            <div className="flex flex-col items-center mb-0.5 -mt-2" style={{ transform: 'scaleX(0.977) scaleY(0.69)' }}>
              <h1
                className="text-2xl md:text-3xl tracking-wider"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  color: '#f0e6c8',
                  textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(201,164,76,0.15)',
                  letterSpacing: '0.2em',
                  fontWeight: 400,
                }}
              >
                Junko Bodie
              </h1>
              <div className="flex items-center gap-2 -mt-0.5">
                <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
                <span
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{
                    color: '#c9a44c',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  Roulette
                </span>
                <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
              </div>
            </div>

            {/* Betting Grid */}
            <div className="w-full">
              <BettingLayout
                bets={bets}
                onPlaceBet={onPlaceBet}
                onRemoveBet={onRemoveBet}
                disabled={isBettingDisabled}
                winningResult={currentResult}
                payoutResult={lastPayout}
                showWinHighlight={!!currentResult && !isSpinning}
                phase={phase}
              />
            </div>

            {/* ═══ BUTTONS — directly below betting grid ═══ */}
            <div
              className="flex items-center justify-end gap-2 mt-1.5 w-full"
              style={{ transform: 'scaleX(0.877) scaleY(0.645)' }}
            >
              {/* RESET — compact bordered box */}
              <button
                onClick={onRebet}
                disabled={!canBet || !hasLastSpin}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: '#d4d0c4',
                  background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                  border: '1.5px solid #5ea896',
                  borderRadius: '3px',
                  padding: '5px 10px',
                  lineHeight: 1,
                }}
              >
                Reset
              </button>

              {/* CLEAR — compact bordered box (clears all bets) */}
              <button
                onClick={onClearBets}
                disabled={!canBet || !hasBets}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: '#d4d0c4',
                  background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                  border: '1.5px solid #5ea896',
                  borderRadius: '3px',
                  padding: '5px 10px',
                  lineHeight: 1,
                }}
              >
                Clear
              </button>

              {/* CLEAR LAST BET — compact bordered box with sub-label */}
              <button
                onClick={onClearLastBet}
                disabled={!canBet || !hasBets}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all duration-200 hover:border-[#c9a44c] hover:text-white"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: '#d4d0c4',
                  background: 'linear-gradient(180deg, #2a3a2e 0%, #1a2a1e 100%)',
                  border: '1.5px solid #5ea896',
                  borderRadius: '3px',
                  padding: '3px 8px',
                  lineHeight: 1,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: '1px',
                }}
              >
                <span>Clear</span>
                <span style={{ fontSize: '6px', opacity: 0.6, letterSpacing: '0.05em' }}>LAST BET</span>
              </button>

              {/* SPIN — dark green oval with thick gold border */}
              <motion.button
                onClick={onSpin}
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
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase' as const,
                  padding: '10px 38px',
                  borderRadius: '9999px',
                  borderWidth: spinEnabled ? '3.5px' : '2px',
                  borderStyle: 'solid',
                  borderColor: spinEnabled ? '#c9a44c' : '#333',
                  boxShadow: spinEnabled
                    ? `0 0 0 2px #1a0f09, 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.3), 0 0 20px rgba(201, 168, 76, 0.2)`
                    : 'none',
                  textShadow: spinEnabled ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                {/* Shimmer overlay */}
                {spinEnabled && !isSpinning && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)',
                      backgroundSize: '200% 100%',
                      borderRadius: '9999px',
                    }}
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