'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BetTimerProps {
  duration: number;
  isActive: boolean;
  onTimeout: () => void;
  variant?: 'default' | 'large';
}

export default function BetTimer({ duration, isActive, onTimeout, variant = 'default' }: BetTimerProps) {
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

  const isLarge = variant === 'large';
  const size = isLarge ? 64 : 48;
  const radius = isLarge ? 26 : 20;
  const center = size / 2;
  const strokeWidth = isLarge ? 5 : 4;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`flex flex-col items-center justify-center p-1 ${isLarge ? 'mb-0' : 'mb-2'}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Progress Circle Tray */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            stroke={timeLeft <= 5 ? '#ff4444' : '#c9a44c'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        <span className={`${isLarge ? 'text-lg' : 'text-lg'} font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-[#c9a44c]'}`}>
          {timeLeft}
        </span>
      </div>
      <span className={`${isLarge ? 'text-[8px]' : 'text-[8px]'} uppercase tracking-widest text-[#c9a44c]/60 font-bold mt-1 whitespace-nowrap`}>
        Time to Bet
      </span>
    </div>
  );
}
