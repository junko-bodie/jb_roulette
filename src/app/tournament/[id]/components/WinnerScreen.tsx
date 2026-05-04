'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, ChevronRight, Play, Star, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

interface WinnerScreenProps {
  tournament: any;
  player: {
    username: string;
    is_bot: boolean;
    final_chips: number;
    final_position: number;
    eliminated_round: number;
  };
}

export default function WinnerScreen({ tournament, player }: WinnerScreenProps) {
  useEffect(() => {
    // Only trigger rewards for the real player once
    const realPlayer = tournament.players.find((p: any) => !p.is_bot);
    if (player.username === realPlayer?.username) {
      fetch(`/api/tournament/${tournament._id}/rewards`, { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('Rewards processed:', data))
        .catch(err => console.error('Rewards error:', err));
    }
  }, []);

  const isWinner = player.final_position === 1;

  useEffect(() => {
    if (isWinner) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isWinner]);

  const standings = useMemo(() => {
    return [...tournament.players].sort((a, b) => {
      const posA = a.final_position || (a.status === "active" ? 1 : 6);
      const posB = b.final_position || (b.status === "active" ? 1 : 6);
      return posA - posB;
    });
  }, [tournament]);

  const pointsEarned = (7 - player.final_position) * 250 + Math.floor(player.final_chips / 10);

  return (
    <div 
      className="fixed inset-0 z-[250] overflow-y-auto flex flex-col items-center selection:bg-gold/30"
      style={{ 
        background: `radial-gradient(circle at 50% 30%, ${COLORS.deepGreen} 0%, ${COLORS.black} 100%)`
      }}
    >
      {/* ═══ LUXURY OVERLAYS ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center pt-24 pb-48 px-6">
        
        {/* ═══ TOP TROPHY ICON ═══ */}
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="relative mb-16"
        >
          <div className="absolute inset-0 bg-gold/30 blur-[80px] rounded-full" />
          <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-gold/40 to-gold/5 border border-gold/40 flex items-center justify-center backdrop-blur-xl shadow-[0_0_60px_rgba(201,168,76,0.2)]">
             <Trophy size={64} className="text-gold" />
          </div>
          {/* Animated Orbiting Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 border border-gold/10 rounded-full border-dashed"
          />
        </motion.div>

        {/* ═══ HEADER SECTION ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <h1 className="text-8xl font-black text-white uppercase tracking-tighter mb-4 italic" style={{ fontFamily: FONTS.primary }}>
            Final Standings
          </h1>
          <div className="flex items-center gap-6 justify-center">
             <div className="h-px w-16 bg-gradient-to-l from-gold/50 to-transparent" />
             <span className="text-[14px] font-black text-gold uppercase tracking-[0.8em]">Ranked #{player.final_position} Overall</span>
             <div className="h-px w-16 bg-gradient-to-r from-gold/50 to-transparent" />
          </div>
        </motion.div>

        {/* ═══ SUMMARY STATS GRID ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-24">
          {[
            { label: 'Final Position', value: `#${player.final_position}`, color: 'text-white' },
            { label: 'Chips Secured', value: `$${player.final_chips.toLocaleString()}`, color: 'text-gold' },
            { label: 'Season Points', value: `+${pointsEarned}`, color: 'text-emerald-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center group relative overflow-hidden backdrop-blur-md"
            >
              <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] mb-6">
                {stat.label}
              </span>
              <div className={`text-6xl font-black ${stat.color} leading-none tracking-tighter`} style={{ fontFamily: FONTS.primary }}>
                {stat.value}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* ═══ CLASSIFICATION TABLE (MATCHING ELITE REGISTRY STYLE) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full bg-white/[0.02] border border-white/10 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.7)] backdrop-blur-3xl overflow-hidden"
        >
          <div className="p-8 border-b border-white/5 bg-white/[0.03]">
             <h3 className="text-[12px] font-black text-white/30 uppercase tracking-[0.6em] text-center">
               Tournament Classification Protocol
             </h3>
          </div>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-8 px-16 text-[12px] font-black uppercase tracking-[0.5em] text-white/20 w-32 text-center">Rank</th>
                <th className="py-8 px-8 text-[12px] font-black uppercase tracking-[0.5em] text-white/20 text-left">Competitor</th>
                <th className="py-8 px-16 text-[12px] font-black uppercase tracking-[0.5em] text-white/20 text-right">Final Stack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {standings.map((s, idx) => {
                const realPlayer = tournament.players.find((p: any) => !p.is_bot);
                const isMe = s.username === realPlayer?.username;
                const isGold = idx === 0;
                
                return (
                  <motion.tr 
                    key={s.player_id.toString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + (idx * 0.05) }}
                    className={`group transition-all ${
                      isMe ? 'bg-gold/[0.08]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-8 px-16 text-center">
                       <span className={`text-4xl font-black italic leading-none ${
                         isGold ? 'text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.5)]' : 
                         isMe ? 'text-gold' : 'text-white/10'
                       }`} style={{ fontFamily: FONTS.primary }}>
                         {idx + 1}
                       </span>
                    </td>
                    <td className="py-8 px-8">
                       <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                            isMe ? 'bg-gold/10 border-gold shadow-[0_0_20px_rgba(201,168,76,0.3)]' : 
                            'bg-white/5 border-white/10'
                          }`}>
                            {isGold ? <Award size={28} className="text-gold" /> : <User size={24} className={isMe ? 'text-gold' : 'text-white/20'} />}
                          </div>
                          <div className="flex flex-col">
                             <div className="flex items-center gap-3">
                                <span className={`text-2xl font-black uppercase tracking-wider ${isMe ? 'text-gold' : 'text-white/90'}`}>
                                  {s.username}
                                </span>
                                {isMe && <ShieldCheck size={16} className="text-gold" />}
                             </div>
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">
                               {isMe ? 'Sanctioned Pro' : 'Tournament Field'}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="py-8 px-16 text-right">
                       <div className="flex flex-col items-end">
                          <span className={`text-4xl font-black leading-none ${isMe ? 'text-gold' : 'text-white/80'}`} style={{ fontFamily: FONTS.primary }}>
                            ${(s.final_chips || s.current_chips || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-1">
                            Closing Assets
                          </span>
                       </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        {/* ═══ ACTION SECTION ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-32 flex flex-col items-center gap-12 w-full"
        >
          <div className="flex flex-col items-center gap-4 opacity-30">
             <p className="text-[11px] font-black text-white uppercase tracking-[0.5em] text-center">
               Registry synchronized with Global Championship Protocol
             </p>
             <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>

          <Link href="/lobby" className="group relative">
             <div className="absolute -inset-4 bg-gold/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
             <div className="relative flex items-center gap-10 px-20 py-10 bg-white text-black font-black uppercase tracking-[0.5em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_30px_70px_rgba(255,255,255,0.1)] group-hover:bg-gold transition-colors">
                <Star size={24} className="fill-current" />
                <span className="text-xl">Return to Lobby</span>
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
             </div>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
