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
    <div className="mx-auto w-full max-w-[1500px]">
      {/* THE FOAM BUFFER — Unified for both wheel and table */}
      <div
        className="relative p-8 sm:p-12 rounded-[50px] shadow-[0_40px_100px_rgba(0,0,0,0.9)] w-full overflow-hidden"
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
          className="relative rounded-2xl border-4 overflow-hidden flex flex-row items-center justify-start gap-8"
          style={{
            background: '#2b8673', // Rich casino green
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
            className="relative flex justify-center items-center flex-1"
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
            className="flex-[2] flex flex-col items-center justify-center p-2"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0.5, scaleX: 1.14, scaleY: 1.55 }}
            transition={{ duration: 0.5 }}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}