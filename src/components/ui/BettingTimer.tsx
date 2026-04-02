/**
 * BettingTimer — 45s countdown timer during the betting phase.
 * Handled prominently with rich casino-themed colors.
 */

'use client';

import { motion } from 'framer-motion';

interface BettingTimerProps {
  timeRemaining: number;
}

export default function BettingTimer({ timeRemaining }: BettingTimerProps) {
  /*
  let color = '#c9a44c'; // Gold (45-16s)
  if (timeRemaining <= 15 && timeRemaining > 5) color = '#f97316'; // Orange (15-6s)
  if (timeRemaining <= 5) color = '#ef4444'; // Red (5-0s)

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl shadow-2xl border-2 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 25, 20, 0.95) 0%, rgba(10, 15, 10, 0.95) 100%)',
          borderColor: color + '50', // 50 is hex opacity for ~30%
        }}
    >
      <h3 className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1" 
          style={{ color: '#fff', opacity: 0.8 }}
      >
        Place Your Bets
      </h3>
      <motion.div
        key={timeRemaining}
        initial={{ scale: 1.1, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-3xl sm:text-4xl md:text-5xl font-black tabular-nums tracking-tighter"
        style={{ 
          fontFamily: 'var(--font-playfair)',
          color: color,
          textShadow: `0 0 20px ${color}80, 0 0 10px ${color}40`
        }}
      >
        {Math.max(0, timeRemaining).toString().padStart(2, '0')}
      </motion.div>
    </div>
  );
  */
  return null;
}
