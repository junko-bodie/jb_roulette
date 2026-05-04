'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type SpinResult } from '@/lib/rng';
import { type PayoutResult } from '@/lib/payouts';
import { COLORS } from '@/styles/theme';
import { soundEngine } from '@/lib/audioEngine';

interface ResultDisplayProps {
  result: SpinResult | null;
  payout: PayoutResult | null;
  visible: boolean;
  onDismiss: () => void;
}

function getNumberColor(color: SpinResult['color']): string {
  switch (color) {
    case 'red': return '#ef4444';
    case 'black': return 'rgba(255,255,255,0.85)';
    case 'green': return '#10b981';
  }
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startTimeRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (value === 0) return;
    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{(value === 0 ? 0 : display).toLocaleString()}</>;
}

export default function ResultDisplay({ result, payout, visible, onDismiss }: ResultDisplayProps) {
  useEffect(() => {
    if (visible && result) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, result, onDismiss]);

  return (
    <AnimatePresence>
      {visible && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{
              background: 'rgba(10, 12, 16, 0.98)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-amber-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Result
                </span>
              </div>
              <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">
                Round complete
              </span>
            </div>

            {/* Winning Number */}
            <div className="flex flex-col items-center py-10 gap-2 border-b border-white/[0.05]">
              <span className="text-[10px] text-white/25 font-medium uppercase tracking-[0.2em] mb-2">
                Winning Number
              </span>

              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative flex items-center justify-center"
              >
                {/* Subtle glow behind number */}
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-20"
                  style={{ backgroundColor: getNumberColor(result.color), transform: 'scale(1.8)' }}
                />
                <span
                  className="relative text-[96px] font-black leading-none tabular-nums"
                  style={{
                    color: getNumberColor(result.color),
                    fontFamily: 'var(--font-playfair)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {result.displayNumber}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mt-1"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getNumberColor(result.color) }}
                />
                <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">
                  {result.color}
                </span>
              </motion.div>
            </div>

            {/* Payout rows */}
            {payout && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="divide-y divide-white/[0.04]"
              >
                {/* Total Won */}
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] text-white/35 font-medium uppercase tracking-wider">
                    Total Won
                  </span>
                  <span className="text-[14px] font-bold text-white/75 tabular-nums">
                    $<AnimatedCounter value={payout.totalWon} duration={900} />
                  </span>
                </div>

                {/* Total Bet */}
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-[11px] text-white/35 font-medium uppercase tracking-wider">
                    Total Bet
                  </span>
                  <span className="text-[14px] font-bold text-white/75 tabular-nums">
                    $<AnimatedCounter value={payout.totalWagered} duration={700} />
                  </span>
                </div>

                {/* Net Result — highlighted */}
                <div className="flex items-center justify-between px-6 py-5">
                  <span className="text-[11px] text-white/35 font-medium uppercase tracking-wider">
                    {payout.netResult >= 0 ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.55, duration: 0.35 }}
                    className="text-[22px] font-black tabular-nums"
                    style={{
                      color:
                        payout.netResult > 0
                          ? '#f59e0b'
                          : payout.netResult === 0
                            ? 'rgba(255,255,255,0.5)'
                            : '#ef4444',
                      fontFamily: 'var(--font-playfair)',
                    }}
                  >
                    {payout.netResult > 0 ? '+' : payout.netResult < 0 ? '-' : ''}$
                    <AnimatedCounter value={Math.abs(payout.netResult)} duration={1400} />
                  </motion.span>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div className="relative px-6 py-4 border-t border-white/[0.05] flex items-center justify-between">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  color:
                    payout && payout.netResult > 0
                      ? 'rgba(245,158,11,0.6)'
                      : 'rgba(255,255,255,0.2)',
                }}
              >
                {payout
                  ? payout.netResult > 3000
                    ? 'Incredible streak'
                    : payout.netResult > 0
                      ? 'Nice win'
                      : payout.netResult === 0
                        ? 'Keep going'
                        : 'Try again'
                  : ''}
              </motion.span>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-[10px] text-white/20 font-medium uppercase tracking-wider"
              >
                Tap to continue
              </motion.span>

              {/* Shimmer bar */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}