/**
 * ResultDisplay — Casino-quality winning number overlay
 *
 * Inspired by Roulette Royale: the winning number slides in with
 * a dramatic scale + glow effect, then the payout appears with
 * a counting animation. Smooth, weighted transitions throughout.
 */

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

function getResultBg(color: SpinResult['color']): string {
  switch (color) {
    case 'red':
      return 'radial-gradient(circle, #c0392b 0%, #7b1a1a 70%, #4a0e0e 100%)';
    case 'black':
      return 'radial-gradient(circle, #3a3a3a 0%, #1a1a1a 70%, #0a0a0a 100%)';
    case 'green':
      return 'radial-gradient(circle, #27ae60 0%, #1a6b3c 70%, #0d3d20 100%)';
  }
}

/** Animated counter that counts up from 0 to the target value */
function AnimatedCounter({ value, prefix = '', duration = 1200 }: { value: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startTimeRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (value === 0) return;
    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  const visibleValue = value === 0 ? 0 : display;
  return <>{prefix}{visibleValue.toLocaleString()}</>;
}

export default function ResultDisplay({
  result,
  payout,
  visible,
  onDismiss,
}: ResultDisplayProps) {
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
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={onDismiss}
        >
          <motion.div
            className="flex flex-col items-center gap-8" // Increased gap from 5 to 8
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Glow pulse behind the ball */}
              <motion.div
                className="absolute inset-[-30px] rounded-full" // Increased inset from -20 to -30
                style={{
                  background: result.color === 'red'
                    ? 'radial-gradient(circle, rgba(192,57,43,0.4), transparent 70%)'
                    : result.color === 'green'
                    ? 'radial-gradient(circle, rgba(39,174,96,0.4), transparent 70%)'
                    : 'radial-gradient(circle, rgba(201,168,76,0.3), transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.4, 1], // Increased pulse scale
                  opacity: [0.6, 0.3, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Number ball */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1,
                }}
                className="relative w-64 h-64 rounded-full flex items-center justify-center" 
                style={{
                  background: getResultBg(result.color),
                  border: `6px solid ${COLORS.gold}`, 
                  boxShadow: `
                    0 0 80px rgba(201, 168, 76, 0.5),
                    0 0 140px rgba(201, 168, 76, 0.3),
                    inset 0 -10px 20px rgba(0,0,0,0.5),
                    inset 0 10px 20px rgba(255,255,255,0.2)
                  `,
                }}
              >
                <motion.span
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6, type: 'spring', bounce: 0.5 }}
                  className="text-[120px] font-black text-white leading-none tracking-tighter" 
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    textShadow: `
                      0 8px 16px rgba(0,0,0,0.8),
                      0 2px 4px rgba(255,255,255,0.4),
                      0 0 40px rgba(255,255,255,0.3)
                    `,
                  }}
                >
                  {result.displayNumber}
                </motion.span>
              </motion.div>
            </motion.div>

            {/* Removing property tags as requested */}

            {/* Payout summary */}
            {payout && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                {payout.netResult > 0 ? (
                  <p className="text-5xl font-bold" style={{ color: COLORS.gold, fontFamily: 'var(--font-playfair)' }}>
                    +$<AnimatedCounter value={payout.netResult} duration={1500} />
                  </p>
                ) : payout.netResult === 0 && payout.totalReturned > 0 ? (
                  <p className="text-2xl" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-playfair)' }}>
                    Push — Bet Returned
                  </p>
                ) : (
                  <p className="text-4xl font-bold" style={{ color: '#e74c3c', fontFamily: 'var(--font-playfair)' }}>
                    -$<AnimatedCounter value={payout.totalWagered} duration={800} />
                  </p>
                )}
              </motion.div>
            )}

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 2, duration: 0.8 }}
              className="text-sm text-white mt-8" // Slightly larger and more margin
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
