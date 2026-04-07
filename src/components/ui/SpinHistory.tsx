/**
 * SpinHistory — Last 10 results with smooth slide-in
 *
 * Clean horizontal strip. New results ease in from the left
 * with a subtle scale pop. Most recent result has a glow.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type SpinResult } from '@/lib/rng';
import { COLORS } from '@/styles/theme';

interface SpinHistoryProps {
  history: SpinResult[];
}

function getCircleBg(color: SpinResult['color']): string {
  switch (color) {
    case 'red': return COLORS.rouletteRed;
    case 'black': return '#1e1e1e';
    case 'green': return COLORS.rouletteGreen;
  }
}

export default function SpinHistory({ history }: SpinHistoryProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-1">
      <span
        className="text-sm font-bold uppercase tracking-[0.2em] mr-3 whitespace-nowrap"
        style={{ color: '#e0d6c2', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.2em' }}
      >
        History
      </span>

      <div className="flex flex-row items-center justify-start gap-1.5 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {history.map((result, index) => {
            const isNewest = index === history.length - 1;
            return (
              <motion.div
                key={`${result.displayNumber}-${index}`}
                layout
                initial={{ scale: 0, opacity: 0, x: -30 }}
                animate={{
                  scale: 1,
                  opacity: isNewest ? 1 : 0.7 + (index / 10) * 0.3,
                  x: 0,
                }}
                exit={{ scale: 0, opacity: 0, x: 20 }}
                transition={{
                  layout: { type: 'spring', stiffness: 300, damping: 25 },
                  scale: { type: 'spring', stiffness: 400, damping: 22 },
                  opacity: { duration: 0.3 },
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: getCircleBg(result.color),
                  border: isNewest
                    ? `2px solid ${COLORS.gold}`
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isNewest
                    ? `0 0 12px ${getCircleBg(result.color)}50, 0 0 4px ${COLORS.gold}40`
                    : '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  className="text-white font-semibold"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem' }}
                >
                  {result.displayNumber}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
