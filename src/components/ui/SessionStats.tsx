'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionStatsProps {
  lastBet: number;
  lastWin: number;
  sessionWin: number;
}

export default function SessionStats({ lastBet, lastWin, sessionWin }: SessionStatsProps) {
  const StatItem = ({ label, value, color = '#f4fbfb' }: { label: string; value: number, color?: string }) => (
    <div className="flex flex-col items-center px-4 py-0.5 border-r border-white/5 last:border-0">
      <span className="text-[9px] uppercase tracking-[0.15em] text-[#c9a44c]/70 font-bold mb-0">
        {label}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="text-xs font-black tracking-tight"
          style={{ color, fontFamily: 'var(--font-inter)' }}
        >
          {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </div>
  );

  return (
    <div 
      className="flex items-center px-2 py-0.5 rounded-lg bg-black/30 border border-white/5 shadow-inner"
    >
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
