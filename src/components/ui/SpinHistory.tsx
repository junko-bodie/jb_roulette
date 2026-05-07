/**
 * SpinHistory — Last 25 results with smooth slide-in
 *
 * Clean horizontal strip. New results ease in from the left
 * with a subtle scale pop. Most recent result has a gold border and glow.
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
    case 'black': return '#2a2a2a'; // Lighter black for better visibility
    case 'green': return COLORS.rouletteGreen;
  }
}

export default function SpinHistory({ history }: SpinHistoryProps) {
  // Only show the last 15 results to prevent header overflow
  const displayedHistory = history.slice(0, 15);

  return (
    <div className="flex items-center gap-3 px-4 py-1 min-w-0 max-w-full">
      <span
        className="text-sm font-bold uppercase tracking-[0.2em] mr-6 whitespace-nowrap hidden sm:inline-block"
        style={{ color: '#f5edd5', fontFamily: "'Georgia', serif", letterSpacing: '0.2em' }}
      >
        History
      </span>

      <div className="flex flex-row items-center justify-start gap-1.5 overflow-hidden min-w-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {displayedHistory.map((result, index) => {
            const isNewest = index === 0;
            return (
              <motion.div
                key={`${result.displayNumber}-${index}`}
                layout
                initial={{ scale: 0, opacity: 0, x: -30 }}
                animate={{
                  scale: 1,
                  opacity: isNewest ? 1 : Math.max(0.65, 1 - (index / 20)), // Significantly brighter falloff
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
                    : '1px solid rgba(255,255,255,0.25)', // Brighter border
                  boxShadow: isNewest
                    ? `0 0 12px ${getCircleBg(result.color)}50, 0 0 4px ${COLORS.gold}40`
                    : '0 1px 4px rgba(0,0,0,0.4)',
                }}
              >
                <span
                  className="text-white font-bold" // Increased weight
                  style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem' }} // Slightly larger font
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
