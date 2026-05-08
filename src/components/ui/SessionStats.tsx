'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionStatsProps {
  lastBet: number;
  lastWin: number;
  sessionWin: number;
}

export default function SessionStats({ lastBet, lastWin, sessionWin }: SessionStatsProps) {
  const StatItem = ({ label, value, color = '#fdfcf7' }: { label: string; value: number, color?: string }) => (
    <div
      className="flex flex-col items-center px-1 sm:px-1.5 lg:px-2 py-1 sm:py-2 lg:py-5 rounded-lg bg-black/60 border border-white/20 shadow-inner lg:min-w-[90px]"
    >
      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-[#c9a44c] font-bold mb-0.5">
        {label}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="text-sm sm:text-base font-black tracking-tight"
          style={{ color, fontFamily: 'var(--font-inter)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
        >
          {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <StatItem label="Last Bet" value={lastBet} />
      <StatItem
        label="Last Win"
        value={lastWin}
        color={lastWin > 0 ? '#10b981' : lastWin < 0 ? '#ef4444' : '#f4fbfb'}
      />
      <StatItem
        label="Session Win"
        value={sessionWin}
        color={sessionWin > 0 ? '#10b981' : sessionWin < 0 ? '#ef4444' : '#f4fbfb'}
      />
    </div>
  );
}
