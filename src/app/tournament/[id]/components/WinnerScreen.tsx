'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Star, ArrowLeft, Gift, Award } from 'lucide-react';

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
    if (player.username === tournament.players.find((p: any) => !p.is_bot)?.username) {
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

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isWinner]);

  // Standing calculation
  const standings = useMemo(() => {
    return [...tournament.players].sort((a, b) => {
      const posA = a.final_position || (a.status === "active" ? 1 : 6);
      const posB = b.final_position || (b.status === "active" ? 1 : 6);
      return posA - posB;
    });
  }, [tournament]);

  const pointsEarned = (7 - player.final_position) * 250 + Math.floor(player.final_chips / 10);
  const seasonPoints = player.final_position === 1 ? 100 : 
                       player.final_position === 2 ? 60 : 
                       player.final_position === 3 ? 40 : 
                       player.final_position === 4 ? 25 : 
                       player.final_position === 5 ? 10 : 5;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#050d0a] flex flex-col items-center py-16 px-4 pb-24" style={{ background: `radial-gradient(circle at center, #165b45 0%, #050d0a 100%)` }}>
      
      {/* ═══ WINNER BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl text-center mb-16"
      >
        <div className="flex justify-center mb-10">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 border-2 border-dashed border-gold/30 rounded-full"
            />
            <div className={`w-28 h-28 rounded-full flex items-center justify-center ${isWinner ? 'bg-gold shadow-[0_0_60px_rgba(201,164,76,0.7)]' : 'bg-white/10'}`}>
              {isWinner ? <Trophy className="w-14 h-14 text-black" /> : <Medal className="w-14 h-14 text-gold" />}
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
          {isWinner ? "Tournament Champion" : player.final_position === 2 ? "Runner Up — Well Played" : "Final Standings"}
        </h1>
        <p className="text-gold/60 font-bold uppercase tracking-[0.4em] text-base">
          {isWinner ? "You dominated the table!" : `You finished in #${player.final_position} place`}
        </p>
      </motion.div>

      {/* ═══ STATS GRID ═══ */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-black/40 border border-white/5 rounded-3xl p-10 backdrop-blur-xl text-center shadow-2xl">
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-3 block">Final Rank</span>
           <div className="text-5xl font-black text-gold">#{player.final_position}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-black/40 border border-white/5 rounded-3xl p-10 backdrop-blur-xl text-center shadow-2xl">
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-3 block">Chips Collected</span>
           <div className="text-5xl font-black text-white">${player.final_chips.toLocaleString()}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-black/40 border border-white/5 rounded-3xl p-10 backdrop-blur-xl text-center shadow-2xl">
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-3 block">Global XP</span>
           <div className="text-5xl font-black text-green-500">+{pointsEarned}</div>
        </motion.div>
      </div>

      {/* ═══ REWARDS BANNER (ONLY FOR REAL PLAYERS) ═══ */}
      {!player.is_bot && (
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="w-full max-w-4xl mb-16 p-10 rounded-[2.5rem] border-2 border-gold/30 bg-gradient-to-br from-gold/10 via-black to-black backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Background Highlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="flex-shrink-0">
               <div className="w-20 h-20 rounded-2xl bg-gold/20 flex items-center justify-center border border-gold/40">
                  <Gift className="w-10 h-10 text-gold" />
               </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-wider mb-2">Rewards Unlocked</h3>
               <p className="text-white/60 text-sm leading-relaxed max-w-xl">
                 Congratulations! Based on your performance, you have earned the following rewards for your account profile.
               </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-6">
               <div className="flex flex-col items-center p-4 bg-black/40 rounded-2xl border border-white/10 min-w-[120px]">
                  <span className="text-2xl font-black text-gold">+{seasonPoints}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Season Pts</span>
               </div>
               {isWinner && (
                 <div className="flex flex-col items-center p-4 bg-gold/10 rounded-2xl border border-gold/30 min-w-[120px]">
                    <Award className="w-6 h-6 text-gold mb-1" />
                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Champion Badge</span>
                 </div>
               )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ FINAL STANDINGS ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-4xl bg-black/60 border border-white/10 rounded-[2.5rem] p-12 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] mb-16"
      >
        <h3 className="text-[11px] font-black text-gold uppercase tracking-[0.5em] mb-10 text-center">Full Tournament Standings</h3>
        
        <div className="space-y-6">
          {standings.map((s, idx) => {
            const isMe = s.player_id.toString() === tournament.players.find((p: any) => !p.is_bot)?.player_id.toString();
            return (
              <div key={s.player_id.toString()} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                idx === 0 ? 'bg-gold/10 border-gold/40' : 
                isMe ? 'bg-white/10 border-gold/30' : 'bg-black/40 border-white/5'
              }`}>
                <div className="flex items-center gap-8">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                    idx === 0 ? 'bg-gold text-black' : 'bg-white/5 text-white/40'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-black text-lg ${isMe ? 'text-gold' : 'text-white'}`}>{s.username}</span>
                    <span className="text-[11px] text-white/30 uppercase tracking-widest font-bold">{s.is_bot ? 'Robot CPU' : 'Participant'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-white">${s.current_chips.toLocaleString()}</div>
                  <div className="text-[10px] text-white/20 uppercase font-black tracking-tighter">Final Balance</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ ACTION ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <Link href="/tournament" className="group flex items-center gap-4 px-12 py-6 bg-gold text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(201,164,76,0.4)] text-lg">
          <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-2" />
          Play Another Tournament
        </Link>
      </motion.div>

    </div>
  );
}

