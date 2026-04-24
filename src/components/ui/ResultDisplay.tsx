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
      // Synchronized with server RESULT_DURATION (2s)
      const timer = setTimeout(onDismiss, 2000);
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
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ 
            background: 'rgba(0,0,0,0.92)', 
            willChange: 'opacity',
            transform: 'translateZ(0)'
          } as React.CSSProperties}
          onClick={onDismiss}
        >
          <motion.div
            className="flex flex-col items-center gap-12" 
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer glow ring */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative"
            >
              {/* Simplified Glow pulse */}
              <motion.div
                className="absolute inset-[-40px] rounded-full" 
                style={{
                  background: result.color === 'red'
                    ? 'radial-gradient(circle, rgba(192,57,43,0.3), transparent 80%)'
                    : result.color === 'green'
                    ? 'radial-gradient(circle, rgba(39,174,96,0.3), transparent 80%)'
                    : 'radial-gradient(circle, rgba(201,168,76,0.25), transparent 80%)',
                } as React.CSSProperties}
                animate={{
                  scale: [1, 1.1, 1], 
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />

              {/* Number ball */}
              <motion.div
                initial={{ scale: 0.4, rotate: -45, y: 40 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{
                  duration: 0.9,
                  ease: [0.2, 0.8, 0.2, 1],
                  delay: 0.05,
                }}
                className="relative w-72 h-72 rounded-full flex items-center justify-center" 
                style={{
                  background: getResultBg(result.color),
                  border: `8px solid ${COLORS.gold}`, 
                  boxShadow: `
                    0 0 100px rgba(201, 168, 76, 0.4),
                    inset 0 -12px 24px rgba(0,0,0,0.6),
                    inset 0 12px 24px rgba(255,255,255,0.2)
                  `,
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                } as React.CSSProperties}
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                  className="font-black text-white leading-none" 
                  style={{
                    fontFamily: '"Cinzel Decorative", "Georgia", serif',
                    fontWeight: 900,
                    fontSize: result.displayNumber.length > 2 ? '90px' : result.displayNumber.length > 1 ? '120px' : '140px',
                    letterSpacing: result.displayNumber.length > 1 ? '0.02em' : '0.05em',
                    textShadow: '0 10px 20px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2)',
                  } as React.CSSProperties}
                >
                  {result.displayNumber}
                </motion.span>
              </motion.div>
            </motion.div>

            {/* Payout summary */}
            {payout && (
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                 className="text-center"
                 style={{ willChange: 'transform, opacity' }}
               >
                {payout.netResult > 0 ? (
                  <p className="text-6xl font-bold tracking-tight" style={{ color: COLORS.gold, fontFamily: 'var(--font-playfair)' }}>
                    +$<AnimatedCounter value={payout.netResult} duration={1500} />
                  </p>
                ) : payout.netResult === 0 && payout.totalReturned > 0 ? (
                  <p className="text-2xl font-medium tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-playfair)' }}>
                    Push — Returned
                  </p>
                ) : (
                  <p className="text-5xl font-bold tracking-tight" style={{ color: '#ff4d4d', fontFamily: 'var(--font-playfair)' }}>
                    -$<AnimatedCounter value={payout.totalWagered} duration={800} />
                  </p>
                )}
              </motion.div>
            )}

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-xs uppercase tracking-[0.3em] font-bold text-white mt-4" 
              style={{ fontFamily: 'var(--font-inter)' } as React.CSSProperties}
            >
              Tap anywhere
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
