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
  clearBets: () => void;
  totalBet: number;
  handleSpin: () => void;
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
  clearBets,
  totalBet,
  handleSpin,
}: RouletteTableProps) {
  return (
    <div className="mobile-landscape-shell mx-auto w-full max-w-[1400px] pt-4 md:pt-6 lg:pt-8 bg-black/10 rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] border border-white/5 my-4">
      <div className="mobile-landscape-row flex flex-col md:flex-row items-center gap-4 md:gap-4 lg:gap-8 px-4 pb-4">

        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          className="mobile-landscape-wheel w-full md:w-[48%] flex flex-col justify-center items-center overflow-hidden"
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

          {/* Wheel type toggle */}
          <div
            className="flex items-center gap-2 text-xs mt-4"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <button
              onClick={() => setWheelType('american')}
              className="px-3 py-1 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: wheelType === 'american' ? '#c9a84c20' : 'transparent',
                color: wheelType === 'american' ? '#c9a84c' : '#c2d7d5',
                border: `1px solid ${wheelType === 'american' ? '#c9a84c40' : 'transparent'}`,
              }}
            >
              American
            </button>
            <button
              onClick={() => setWheelType('european')}
              className="px-3 py-1 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                background: wheelType === 'european' ? '#c9a84c20' : 'transparent',
                color: wheelType === 'european' ? '#c9a84c' : '#c2d7d5',
                border: `1px solid ${wheelType === 'european' ? '#c9a84c40' : 'transparent'}`,
              }}
            >
              European
            </button>
          </div>
        </motion.div>

        {/* Board */}
        <motion.div
          className="w-full md:w-[50%] lg:w-[52%] flex flex-col justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div
            className="w-full rounded-md border p-1.5 overflow-hidden relative"
            style={{ background: '#2b8673', borderColor: '#5ea896', borderWidth: '2px' }}
          >
            <div
              className="w-full flex justify-center"
              style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}
            >
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

          {/* Action row */}
          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              {totalBet > 0 && !isSpinning && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <button
                    onClick={clearBets}
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

            <div className="flex items-center gap-3">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="px-8 py-2 rounded-full font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c, #8b6b22)',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                {isSpinning ? 'Spinning...' : 'Spin'}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}