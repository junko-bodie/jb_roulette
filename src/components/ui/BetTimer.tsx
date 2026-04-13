'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BetTimerProps {
  duration: number;
  isActive: boolean;
  onTimeout: () => void;
}

export default function BetTimer({ duration, isActive, onTimeout }: BetTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onTimeout, duration]);

  const percentage = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-2 mb-2">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Progress Circle Tray */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
            fill="none"
          />
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            stroke={timeLeft <= 5 ? '#ff4444' : '#c9a44c'}
            strokeWidth="4"
            fill="none"
            strokeDasharray="125.66"
            animate={{ strokeDashoffset: 125.66 * (1 - percentage / 100) }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>
        
        <span className={`text-lg font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#c9a44c]'}`}>
          {timeLeft}
        </span>
      </div>
      <span className="text-[8px] uppercase tracking-widest text-[#c9a44c]/60 font-bold mt-1">
        Time to Bet
      </span>
    </div>
  );
}
