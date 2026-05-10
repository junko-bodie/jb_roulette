'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RULES = [
  "5 Rounds Total: Survival is the ultimate goal.",
  "Elimination: Lowest score at the end of each round is cut.",
  "Last Player Standing: The final survivor takes the grand prize.",
  "30s Betting Window: Place your bets before the timer hits zero.",
  "Positive Balance required: Must finish with > 0 chips to earn points.",
  "Bust Penalty: -50 points for anyone ending with 0 chips.",
  "Points: 1st (1000), 2nd (100), 3rd (50) championship points.",
];

export default function TournamentRules() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % RULES.length);
    }, 5000); // Switch every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-8 w-full max-w-sm overflow-hidden rounded-lg bg-white/5 border border-[#c9a44c]/30 flex items-center px-4 backdrop-blur-sm shadow-inner">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 w-full"
        >
          <div className="w-1 h-1 rounded-full bg-[#c9a44c] shadow-[0_0_8px_#c9a44c]" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
            {RULES[index]}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
