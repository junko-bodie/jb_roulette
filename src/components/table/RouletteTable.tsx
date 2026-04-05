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
}: RouletteTableProps) {
  return (
    <div className="mobile-landscape-shell mx-auto w-full max-w-[1400px] bg-black/10 rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] border border-white/5">
      {/* Vertical stack: wheel then table, absolutely no gap */}
      <div className="mobile-landscape-row flex flex-col items-center" style={{ gap: 0, margin: 0, padding: 0 }}>

        {/* Wheel wrapper — relative so the toggle can overlay */}
        <motion.div
          ref={wheelRef}
          className="mobile-landscape-wheel relative flex justify-center items-center overflow-visible"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginBottom: '-8px', paddingBottom: 0, zIndex: 2 }}
        >
          <RouletteWheel
            wheelType={wheelType}
            spinResult={currentResult}
            isSpinning={isSpinning}
            onSpinComplete={onSpinComplete}
            size={wheelSize}
          />

          {/* Wheel type toggle — overlaid at bottom-left of wheel */}
          <div
            className="absolute flex items-center gap-1 text-[10px] z-30"
            style={{
              fontFamily: 'var(--font-inter)',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '12px',
              padding: '2px 6px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <button
              onClick={() => setWheelType('american')}
              className="px-2 py-0.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: wheelType === 'american' ? '#c9a84c30' : 'transparent',
                color: wheelType === 'american' ? '#c9a84c' : '#c2d7d580',
                border: `1px solid ${wheelType === 'american' ? '#c9a84c40' : 'transparent'}`,
              }}
            >
              American
            </button>
            <button
              onClick={() => setWheelType('european')}
              className="px-2 py-0.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: wheelType === 'european' ? '#c9a84c30' : 'transparent',
                color: wheelType === 'european' ? '#c9a84c' : '#c2d7d580',
                border: `1px solid ${wheelType === 'european' ? '#c9a84c40' : 'transparent'}`,
              }}
            >
              European
            </button>
          </div>
        </motion.div>

        {/* Board — Buffered with THICK cushiony foam edge */}
        <motion.div
          className="w-full h-fit flex flex-col items-center justify-center min-h-0 py-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* THE FOAM BUFFER — Full Width & Realistic 3D */}
          <div
            className="relative p-6 sm:p-14 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] w-full max-w-none"
            style={{
              background: '#2d1a10', // Darker, richer leather brown
              backgroundImage: `
                linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.3) 100%),
                radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 80%)
              `,
              border: '4px solid #1a0f09',
              boxShadow: `
                inset 0 20px 30px rgba(255,255,255,0.06), 
                inset 0 -20px 30px rgba(0,0,0,0.7),
                0 30px 60px rgba(0,0,0,0.9)
              `,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Inner seam line - deeper for 3D effect */}
            <div 
              className="absolute inset-[18px] rounded-[24px] border-2 border-black/40 pointer-events-none"
              style={{ 
                zIndex: 1,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' 
              }}
            />

            {/* The actual betting board inside */}
            <div
              className="rounded-lg border-4 overflow-hidden relative w-full"
              style={{ 
                background: '#2b8673', 
                borderColor: '#11352e', 
                padding: 0,
                zIndex: 2,
                boxShadow: '0 0 30px rgba(0,0,0,0.8)'
              }}
            >
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
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}