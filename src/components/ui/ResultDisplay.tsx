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
  tournamentMode?: boolean;
}

function getNumberColor(color: SpinResult['color']): string {
  switch (color) {
    case 'red': return '#ef4444';
    case 'black': return 'rgba(255,255,255,1.0)';
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

export default function ResultDisplay({ result, payout, visible, onDismiss, tournamentMode }: ResultDisplayProps) {
  useEffect(() => {
    if (visible && result) {
      // Auto-dismiss: 3s for both modes
      const duration = 3000;
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, result, onDismiss, tournamentMode]);

  return (
    <AnimatePresence>
      {visible && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className={`relative w-full ${tournamentMode ? 'max-w-md' : 'max-w-xl'} flex flex-col items-center justify-center`}
            onClick={e => e.stopPropagation()}
          >
            {/* 1. Winning Number (The last number spun) */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="relative flex flex-col items-center mb-12"
            >
              <div
                className="absolute inset-0 rounded-full blur-[80px] opacity-40"
                style={{ backgroundColor: getNumberColor(result.color) }}
              />
              <span
                className="relative font-black tabular-nums"
                style={{
                  color: getNumberColor(result.color),
                  fontFamily: "'Georgia', serif",
                  fontSize: tournamentMode ? 'min(240px, 50vw)' : '160px',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  textShadow: `0 0 40px ${getNumberColor(result.color)}44`,
                }}
              >
                {result.displayNumber}
              </span>
              {!tournamentMode && (
                <span className="text-[14px] text-white/70 font-bold uppercase tracking-[0.4em] mt-4">
                  Winning Number
                </span>
              )}
            </motion.div>

            {/* 2. NET WIN ($ NET WIN) */}
            {payout && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <span className="text-[14px] text-white/70 font-bold uppercase tracking-[0.4em] mb-4">
                  {payout.netResult >= 0 ? 'Net Win' : 'Net Loss'}
                </span>
                <motion.span
                  className="text-[84px] font-black tabular-nums flex items-baseline"
                  style={{
                    color:
                      payout.netResult > 0
                        ? '#4ade80' // Bright Green for win
                        : payout.netResult === 0
                          ? 'rgba(255,255,255,0.7)'
                          : '#ef4444', // Red for loss
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  <span className="text-[48px] mr-2 opacity-80">
                    {payout.netResult > 0 ? '+' : payout.netResult < 0 ? '-' : ''}$
                  </span>
                  <AnimatedCounter value={Math.abs(payout.netResult)} duration={1500} />
                </motion.span>
              </motion.div>
            )}

            {/* Tap to continue indicator (subtle) - Only for regular mode */}
            {!tournamentMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 2, duration: 1 }}
                className="mt-20 text-[11px] text-white/80 font-medium uppercase tracking-[0.3em]"
              >
                Tap to continue
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}