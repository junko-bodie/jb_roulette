'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EliminationScreenProps {
  player: {
    username: string;
    is_bot: boolean;
    final_chips: number;
    position: number;
  } | null;
  visible: boolean;
}

export default function EliminationScreen({ player, visible }: EliminationScreenProps) {
  if (!player) return null;

  const isRealUser = !player.is_bot;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="text-center p-8 max-w-2xl"
          >
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block px-6 py-2 bg-red-600 text-white font-black uppercase tracking-[0.3em] text-sm mb-6 shadow-[0_0_30px_rgba(220,38,38,0.5)]"
            >
              Elimination
            </motion.div>

            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4">
              {isRealUser ? "YOU HAVE BEEN" : player.username}
            </h2>
            <h3 className="text-4xl md:text-6xl font-black text-red-500 uppercase tracking-tighter mb-8">
              ELIMINATED
            </h3>

            <div className="flex flex-col items-center gap-4">
              <div className="text-xl text-white/60 font-bold uppercase tracking-widest">
                Final Position: <span className="text-white text-2xl">#{player.position}</span>
              </div>
              <div className="text-xl text-white/60 font-bold uppercase tracking-widest">
                Final Chips: <span className="text-white text-2xl">${player.final_chips.toLocaleString()}</span>
              </div>
            </div>

            {isRealUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 text-gold animate-pulse text-sm font-bold uppercase tracking-widest"
              >
                Generating Tournament Summary...
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
