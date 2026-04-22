'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Star, ArrowLeft } from 'lucide-react';

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

  // Standing calculation (same as API logic but on client for display)
  const standings = useMemo(() => {
    return [...tournament.players].sort((a, b) => {
      const posA = a.final_position || (a.status === "active" ? 1 : 6);
      const posB = b.final_position || (b.status === "active" ? 1 : 6);
      return posA - posB;
    });
  }, [tournament]);

  const pointsEarned = (7 - player.final_position) * 250 + Math.floor(player.final_chips / 10);

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#050d0a] flex flex-col items-center py-12 px-4" style={{ background: `radial-gradient(circle at center, #165b45 0%, #050d0a 100%)` }}>
      
      {/* ═══ WINNER BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl text-center mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-gold/20 rounded-full"
            />
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isWinner ? 'bg-gold shadow-[0_0_50px_rgba(201,164,76,0.6)]' : 'bg-white/10'}`}>
              {isWinner ? <Trophy className="w-12 h-12 text-black" /> : <Medal className="w-12 h-12 text-gold" />}
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-2">
          {isWinner ? "Tournament Champion" : player.final_position === 2 ? "Runner Up — Well Played" : "Better Luck Next Time"}
        </h1>
        <p className="text-gold/60 font-bold uppercase tracking-[0.3em] text-sm">
          {isWinner ? "You dominated the table!" : `You finished in #${player.final_position} place`}
        </p>
      </motion.div>

      {/* ═══ STATS GRID ═══ */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl text-center">
           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Final Rank</span>
           <div className="text-4xl font-black text-gold">#{player.final_position}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl text-center">
           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Chips Collected</span>
           <div className="text-4xl font-black text-white">${player.final_chips.toLocaleString()}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl text-center">
           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block">Experience Earned</span>
           <div className="text-4xl font-black text-green-500">+{pointsEarned} XP</div>
        </motion.div>
      </div>

      {/* ═══ FINAL STANDINGS ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-4xl bg-black/60 border border-gold/20 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] mb-12"
      >
        <h3 className="text-xs font-black text-gold uppercase tracking-[0.4em] mb-8 text-center">Final Tournament Standings</h3>
        
        <div className="space-y-4">
          {standings.map((s, idx) => {
            const isMe = s.player_id.toString() === tournament.players.find((p: any) => !p.is_bot)?.player_id.toString();
            return (
              <div key={s.player_id.toString()} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                idx === 0 ? 'bg-gold/10 border-gold/40' : 
                isMe ? 'bg-white/10 border-gold/30' : 'bg-black/40 border-white/5'
              }`}>
                <div className="flex items-center gap-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                    idx === 0 ? 'bg-gold text-black' : 'bg-white/5 text-white/40'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold ${isMe ? 'text-gold' : 'text-white'}`}>{s.username}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">{s.is_bot ? 'Robot CPU' : 'Pro Player'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-white">${s.current_chips.toLocaleString()}</div>
                  <div className="text-[9px] text-white/20 uppercase">Final Chips</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ ACTION ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Link href="/tournament" className="group flex items-center gap-3 px-10 py-5 bg-gold text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_15px_40px_rgba(201,164,76,0.4)]">
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Play Another Tournament
        </Link>
      </motion.div>

    </div>
  );
}
