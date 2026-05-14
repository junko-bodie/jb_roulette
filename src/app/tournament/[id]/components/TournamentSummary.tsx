'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Award, Target, Coins, TrendingUp, ChevronRight, Home } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

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
  // Calculate points: Matching the logic in WinnerScreen or similar
  const pointsEarned = (7 - player.final_position) * 250 + Math.floor(player.final_chips / 10);

  return (
    <div 
      className="fixed inset-0 z-[350] flex items-center justify-center" 
      style={{ background: `radial-gradient(circle at 50% 50%, rgba(13, 42, 32, 0.98) 0%, ${COLORS.black} 100%)` }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-16 backdrop-blur-3xl shadow-[0_60px_150px_rgba(0,0,0,0.9)] relative overflow-hidden"
      >
        {/* Decorative corner glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/10 blur-[80px] rounded-full" />
        
        <div className="flex flex-col items-center text-center mb-16 relative z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/40 flex items-center justify-center mb-8"
          >
             <Award size={32} className="text-gold" />
          </motion.div>
          
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none mb-3" style={{ fontFamily: FONTS.primary }}>
            Round Result
          </h1>
          <span className="text-[12px] font-black text-white/50 uppercase tracking-[0.7em] italic">Official Classification Summary</span>
        </div>

        <div className="space-y-4 mb-16 relative z-10">
          {[
            { label: 'Final Rank', value: `#${player.final_position}`, icon: Target, color: 'text-gold' },
            { label: 'Asset Settlement', value: `$${player.final_chips.toLocaleString()}`, icon: Coins, color: 'text-white' },
            { label: 'Season Points', value: `+${pointsEarned}`, icon: TrendingUp, color: 'text-emerald-500' }
          ].map((item, idx) => (
            <div key={item.label} className="flex items-center justify-between p-7 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-6">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-gold transition-colors">
                    <item.icon size={20} />
                 </div>
                 <span className="text-[12px] font-black text-white/60 uppercase tracking-[0.4em]">{item.label}</span>
              </div>
              <span className={`text-3xl font-black ${item.color} leading-none`} style={{ fontFamily: FONTS.primary }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <Link 
            href="/lobby" 
            className="flex items-center justify-center gap-6 w-full py-7 bg-white text-black font-black uppercase tracking-[0.5em] rounded-2xl text-[14px] transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:bg-gold transition-colors group"
          >
            <Home size={18} className="fill-current" />
            Return to Lobby
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
