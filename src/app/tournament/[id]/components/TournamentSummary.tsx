'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TournamentSummaryProps {
  tournament: any;
  player: {
    username: string;
    is_bot: boolean;
    final_chips: number;
    final_position: number;
    eliminated_round: number;
  };
}

export default function TournamentSummary({ tournament, player }: TournamentSummaryProps) {
  // Calculate points: 100 base + chips / 100 + position bonus
  const pointsEarned = 100 + Math.floor(player.final_chips / 100) + (7 - player.final_position) * 50;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#050d0a]" style={{ background: `radial-gradient(circle at center, #165b45 0%, #050d0a 100%)` }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-black/60 border border-gold/30 rounded-[2rem] p-12 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)]"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block px-4 py-1 border border-gold/50 rounded-full text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-4"
          >
            Tournament Result
          </motion.div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Summary</h1>
        </div>

        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between py-4 border-b border-white/5">
            <span className="text-white/40 uppercase tracking-widest text-sm font-bold">Final Position</span>
            <span className="text-3xl font-black text-gold">#{player.final_position}</span>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-white/5">
            <span className="text-white/40 uppercase tracking-widest text-sm font-bold">Final Chip Count</span>
            <span className="text-3xl font-black text-white">${player.final_chips.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-white/5">
            <span className="text-white/40 uppercase tracking-widest text-sm font-bold">Points Earned</span>
            <span className="text-3xl font-black text-green-500">+{pointsEarned}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link href="/tournament" className="w-full py-5 bg-gold text-black font-black uppercase tracking-[0.2em] rounded-2xl text-center transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_rgba(201,164,76,0.3)]">
            Return to Lobby
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
