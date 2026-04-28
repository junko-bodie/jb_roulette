'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Award, ChevronRight, Play } from 'lucide-react';

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

const LaurelIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 19C6 19 3 17 3 12C3 7 6 5 6 5M18 19C18 19 21 17 21 12C21 7 18 5 18 5M12 17L10 19L12 21L14 19L12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14L8 15M7 10L8 9M17 14L16 15M17 10L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

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
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };
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
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#050d0a] flex flex-col items-center py-24 px-4 selection:bg-gold/30">
      {/* ═══ LUXURY BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a5c43_0%,#050d0a_100%)]" />
        
        {/* Blurred Chip Stacks */}
        <motion.img 
          initial={{ opacity: 0, x: -50 }} 
          animate={{ opacity: 0.4, x: 0 }} 
          src="/images/casino/winner_bg.png" 
          className="absolute -bottom-20 -left-40 w-[700px] blur-sm rotate-12" 
        />
        <motion.img 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 0.4, x: 0 }} 
          src="/images/casino/winner_bg.png" 
          className="absolute -bottom-40 -right-40 w-[800px] blur-md -rotate-12 scale-x-[-1]" 
        />
        
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* ═══ TOP ICON ═══ */}
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#c9a44c] to-[#a67c2e] p-[2px] shadow-[0_0_50px_rgba(201,164,76,0.3)]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Award className="w-14 h-14 text-gold" />
            </div>
          </div>
          {/* Circular Glow Effect */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -inset-6 border border-gold/30 rounded-full"
          />
        </motion.div>

        {/* ═══ TITLE SECTION ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-8xl font-black text-white uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
            Final Standings
          </h1>
          <p className="text-gold font-bold uppercase tracking-[0.5em] text-xl">
            Ranked #{player.final_position} Overall
          </p>
        </motion.div>

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
          {[
            { label: 'Final Rank', value: `#${player.final_position}`, color: 'text-gold' },
            { label: 'Chips Collected', value: `$${player.final_chips.toLocaleString()}`, color: 'text-white' },
            { label: 'Global XP Earned', value: `+${pointsEarned}`, color: 'text-[#4ade80]' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="bg-[#0a1612]/80 border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center group hover:border-gold/20 transition-all shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-6 group-hover:text-gold/50 transition-colors">
                {stat.label}
              </span>
              <div className={`text-6xl font-black ${stat.color} tracking-tight`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ CLASSIFICATION TABLE ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-[#0a1410] border border-[#c9a44c]/30 rounded-[3rem] p-4 shadow-[0_60px_150px_rgba(0,0,0,0.9)] mb-16 relative"
        >
          {/* Inner Border Glow */}
          <div className="absolute inset-0 rounded-[3rem] border border-white/5 pointer-events-none" />
          
          <div className="p-10">
            <h3 className="text-[12px] font-black text-gold/40 uppercase tracking-[0.6em] mb-12 text-center">
              Final Tournament Classification
            </h3>
            
            <div className="space-y-4">
              {standings.map((s, idx) => {
                const isMe = s.username === tournament.players.find((p: any) => !p.is_bot)?.username;
                const isWinnerRow = idx === 0;
                
                return (
                  <motion.div 
                    key={s.player_id.toString()}
                    className={`flex items-center justify-between p-7 rounded-2xl border transition-all ${
                      isWinnerRow ? 'bg-[#c9a44c]/10 border-[#c9a44c]/40' : 
                      isMe ? 'bg-white/10 border-white/20' : 'bg-[#0c1a15] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-8">
                      {/* Rank with Laurels */}
                      <div className="relative flex items-center justify-center">
                        <LaurelIcon className={`w-14 h-14 ${isWinnerRow ? 'text-gold' : 'text-white/10'}`} />
                        <span className={`absolute inset-0 flex items-center justify-center font-black text-xl ${isWinnerRow ? 'text-gold' : 'text-white/40'}`}>
                          ({idx + 1})
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`font-black text-2xl tracking-tight ${isMe ? 'text-gold' : 'text-white'}`}>
                          {s.username}
                        </span>
                        <span className="text-[10px] text-white/25 uppercase tracking-widest font-black pt-1">
                          {isMe ? 'YOU' : 'ROBOT CPU'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-black text-3xl text-white tracking-tighter">
                        ${(s.final_chips || s.current_chips || 0).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">
                        Final Chips
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ ACTION BUTTON ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pb-24"
        >
          <Link 
            href="/tournament" 
            className="group relative flex items-center gap-6 px-16 py-8 bg-gradient-to-b from-[#e6c16a] to-[#c9a44c] text-black font-black uppercase tracking-[0.4em] rounded-3xl transition-all hover:scale-105 active:scale-95 shadow-[0_30px_70px_rgba(201,164,76,0.3)] hover:shadow-[0_40px_90px_rgba(201,164,76,0.4)] overflow-hidden text-xl"
          >
            {/* Gloss Highlight */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 skew-y-[-2deg] origin-left" />
            <Play className="w-6 h-6 fill-current" />
            PLAY ANOTHER TOURNAMENT
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

