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
          className="fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-3xl"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, rgba(80, 10, 10, 0.95) 0%, rgba(20, 0, 0, 0.98) 100%)`
          }}
        >
          {/* Brighter Red Pulse Background */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-[900px] h-[900px] bg-red-500 rounded-full blur-[150px]"
          />

          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="relative z-10 text-center p-12 max-w-4xl flex flex-col items-center"
          >
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-28 h-28 rounded-3xl bg-red-600/20 border border-red-500/60 flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(220,38,38,0.4)]"
            >
              <ShieldAlert size={56} className="text-red-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="px-8 py-2.5 bg-red-600/40 border border-red-400/60 rounded-full text-red-100 font-black uppercase tracking-[0.5em] text-[13px] mb-8 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
            >
              System Elimination Active
            </motion.div>

            <h2 className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter mb-4 italic leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" style={{ fontFamily: FONTS.primary }}>
              {isRealUser ? "You Have Been" : player.username}
            </h2>
            <h3 className="text-6xl md:text-8xl font-black text-red-500 uppercase tracking-tighter mb-12 italic leading-none drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]" style={{ fontFamily: FONTS.primary }}>
              Eliminated
            </h3>

            <div className="grid grid-cols-3 gap-8 w-full max-w-3xl bg-white/[0.08] border border-white/20 rounded-[40px] p-10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col items-center gap-3">
                <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.5em]">Final Rank</span>
                <span className="text-5xl font-black text-white leading-none drop-shadow-md" style={{ fontFamily: FONTS.primary }}>
                   #{player.final_position || '?'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 border-l border-white/10">
                <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.5em]">Settled Assets</span>
                <span className="text-5xl font-black text-white leading-none drop-shadow-md" style={{ fontFamily: FONTS.primary }}>
                   ${(player.current_chips || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 border-l border-white/10">
                <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.5em]">Points Earned</span>
                <span className={`text-5xl font-black leading-none drop-shadow-md ${player.current_chips <= 0 ? 'text-rose-400' : 'text-emerald-400'}`} style={{ fontFamily: FONTS.primary }}>
                   {player.current_chips <= 0 ? '-50' : '0'}
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-20 flex flex-col items-center gap-6"
            >
              <div className="flex items-center gap-6">
                 <div className="w-3 h-3 rounded-full bg-white/40 animate-bounce" />
                 <div className="w-3 h-3 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                 <div className="w-3 h-3 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[16px] font-black text-white/80 uppercase tracking-[0.7em] italic drop-shadow-sm">
                {isRealUser ? "Synchronizing Championship Results..." : "Preparing Field for Next Round..."}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
