'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, XCircle, Target, TrendingDown } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

interface EliminationScreenProps {
  player: {
    username: string;
    is_bot: boolean;
    current_chips: number;
    final_position: number;
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
          className="fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-2xl"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, rgba(20, 0, 0, 0.95) 0%, ${COLORS.black} 100%)`
          }}
        >
          {/* Subtle Red Pulse Background */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-[800px] h-[800px] bg-red-600 rounded-full blur-[120px]"
          />

          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="relative z-10 text-center p-12 max-w-3xl flex flex-col items-center"
          >
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 rounded-2xl bg-red-600/10 border border-red-500/40 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
            >
              <ShieldAlert size={48} className="text-red-500" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="px-6 py-2 bg-red-600/20 border border-red-500/40 rounded-full text-red-500 font-black uppercase tracking-[0.4em] text-[11px] mb-8"
            >
              System Elimination Active
            </motion.div>

            <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 italic leading-none" style={{ fontFamily: FONTS.primary }}>
              {isRealUser ? "You Have Been" : player.username}
            </h2>
            <h3 className="text-5xl md:text-7xl font-black text-red-600 uppercase tracking-tighter mb-12 italic leading-none" style={{ fontFamily: FONTS.primary }}>
              Eliminated
            </h3>

            <div className="grid grid-cols-2 gap-8 w-full max-w-md bg-white/[0.02] border border-white/5 rounded-3xl p-10 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Final Rank</span>
                <span className="text-4xl font-black text-white leading-none" style={{ fontFamily: FONTS.primary }}>
                   #{player.final_position || '?'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 border-l border-white/5">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Settled Assets</span>
                <span className="text-4xl font-black text-white leading-none" style={{ fontFamily: FONTS.primary }}>
                   ${(player.current_chips || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-4">
                 <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce" />
                 <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]" />
                 <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[12px] font-black text-white/30 uppercase tracking-[0.6em] italic">
                {isRealUser ? "Synchronizing Results..." : "Preparing Field for Next Round..."}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
