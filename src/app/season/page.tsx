'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Trophy, Crown, ChevronLeft, Users, Zap, TrendingUp, Globe, User, ShieldCheck, Award, ArrowRight, Star } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { COLORS, FONTS } from '@/styles/theme';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  balance: number;
  avatar: string;
  tournaments_won: number;
  badges: any;
  is_pro: boolean;
}

export default function GlobalLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useGame();
  const router = useRouter();

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setEntries(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && entries.length === 0) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ background: COLORS.black }}
      >
        <div className="w-12 h-12 border-4 border-white/10 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center selection:bg-gold/20 selection:text-gold pb-60"
      style={{ 
        background: `radial-gradient(circle at 50% -20%, ${COLORS.deepGreen} 0%, ${COLORS.black} 100%)`
      }}
    >
      
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <nav className="w-full bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 flex justify-center">
        <div className="w-full max-w-7xl px-12 h-24 flex items-center justify-between">
          <Link href="/lobby" className="flex items-center gap-4 text-white/40 hover:text-white transition-colors group min-w-[120px]">
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[14px] font-black uppercase tracking-[0.3em]">Lobby</span>
          </Link>

          <div className="flex flex-col items-center text-center">
             <h1 className="text-[14px] font-black uppercase tracking-[0.6em] text-white/40 mb-1">Global Wealth</h1>
             <div className="flex items-center gap-3">
               <Globe size={14} className="text-gold/50" />
               <span className="text-[12px] font-black text-gold uppercase tracking-[0.4em]">Worldwide Registry</span>
             </div>
          </div>

          <div className="flex items-center gap-10 min-w-[120px] justify-end">
            <Link href="/rankings" className="text-[14px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-colors">Season Pts</Link>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <User size={24} className="text-white/20" />
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-5xl px-10 py-24 flex flex-col items-center">
        
        {/* ═══ LEADERBOARD HEADER (CENTERED) ═══ */}
        <div className="flex flex-col items-center mb-24 text-center w-full">
          <div className="flex items-center gap-6 mb-6 justify-center">
             <Users size={40} className="text-gold/40" />
             <h2 className="text-4xl font-black uppercase tracking-[0.6em] text-white/95 leading-none">Wealth Registry</h2>
          </div>
          <div className="flex flex-col items-center gap-5">
             <p className="text-[14px] font-black text-white/20 uppercase tracking-[0.4em] max-w-xl leading-loose">
               Registry of verified asset equity across the global network.
             </p>
             <div className="flex items-center gap-4 mt-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <span className="text-[13px] font-black text-emerald-500/80 uppercase tracking-[0.5em]">Protocol Sync Active</span>
             </div>
          </div>
        </div>

        {/* ═══ DATA TABLE (CENTERED CONTENT & FIXED CLIPPING) ═══ */}
        <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.05]">
                {/* Increased px-20 to prevent corner clipping */}
                <th className="py-12 px-20 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 w-32 text-center">Rank</th>
                <th className="py-12 px-10 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center">Contender</th>
                <th className="py-12 px-10 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center">Tier</th>
                <th className="py-12 px-10 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center hidden sm:table-cell">Status</th>
                <th className="py-12 px-20 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center">Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {entries.map((player, idx) => {
                const isMe = player.name === userProfile?.name;
                const isGold = player.rank === 1;
                const isSilver = player.rank === 2;
                const isBronze = player.rank === 3;

                return (
                  <motion.tr 
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.05, 1) }}
                    className={`group transition-all ${
                      isMe ? 'bg-gold/[0.08]' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    <td className="py-12 px-20 text-center">
                       <span className={`text-5xl font-black italic tabular-nums leading-none ${
                         isGold ? 'text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.6)]' : 
                         isSilver ? 'text-slate-300' : 
                         isBronze ? 'text-amber-600' : 
                         isMe ? 'text-gold' : 'text-white/20'
                       }`} style={{ fontFamily: FONTS.primary }}>
                         {player.rank}
                       </span>
                    </td>
                    <td className="py-12 px-10">
                      <div className="flex flex-col items-center gap-10 justify-center">
                        <div className={`w-20 h-20 rounded-2xl bg-white/[0.05] border-2 flex items-center justify-center transition-all overflow-hidden ${
                          isMe ? 'border-gold shadow-[0_0_20px_rgba(201,168,76,0.3)]' : 'border-white/10 group-hover:border-white/40'
                        }`}>
                          <img src={player.avatar || '/avatars/default.png'} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-4">
                            <span className={`text-2xl font-black uppercase tracking-widest ${isMe ? 'text-gold' : 'text-white/95'}`}>
                              {player.name}
                            </span>
                            {player.is_pro && (
                              <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                          <span className="text-[13px] font-black text-white/20 uppercase tracking-[0.4em] mt-2 text-center">
                            {player.tournaments_won > 0 ? `${player.tournaments_won} Season Wins` : 'Verified Asset Holder'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-12 px-10 text-center">
                       <div className="flex justify-center">
                         {player.balance > 100000 ? (
                            <div className="px-6 py-3 bg-gold/10 border border-gold/30 rounded-xl text-[12px] font-black text-gold uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(201,168,76,0.1)]">Grandmaster</div>
                         ) : player.balance > 10000 ? (
                            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[12px] font-black text-white/40 uppercase tracking-[0.3em]">Veteran</div>
                         ) : (
                            <div className="px-6 py-3 bg-white/[0.02] border border-white/[0.03] rounded-xl text-[12px] font-black text-white/10 uppercase tracking-[0.3em]">Rookie</div>
                         )}
                       </div>
                    </td>
                    <td className="py-12 px-10 text-center hidden sm:table-cell">
                       <div className="flex items-center justify-center gap-3.5 opacity-20 group-hover:opacity-40 transition-opacity">
                          <TrendingUp size={20} className="text-emerald-500" />
                          <span className="text-[12px] font-black tabular-nums tracking-[0.3em] uppercase">Stable</span>
                       </div>
                    </td>
                    <td className="py-12 px-20 text-center">
                       <span className={`text-5xl font-black tabular-nums leading-none ${isMe ? 'text-gold' : 'text-white'}`} style={{ fontFamily: FONTS.primary }}>
                         ${player.balance.toLocaleString()}
                       </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {entries.length === 0 && (
            <div className="py-48 text-center flex flex-col items-center gap-12">
               <Globe size={80} className="text-white/5 animate-pulse" />
               <span className="text-[16px] font-black uppercase tracking-[0.7em] text-white/20 italic">Synchronizing Global Registry...</span>
            </div>
          )}
        </div>
      </main>

      {/* ═══ FLOATING ACTION BAR (CENTERED) ═══ */}
      <footer className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50">
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-black/80 backdrop-blur-3xl border-t border-white/20 border-x border-white/10 px-20 py-10 rounded-2xl flex items-center gap-20 shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
         >
            <div className="flex items-center gap-6">
               <Star size={24} className="text-gold animate-pulse" />
               <span className="text-[14px] font-black uppercase tracking-[0.6em] text-white/50 italic leading-none">Network Assets</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <Link href="/rankings" className="group flex items-center gap-6">
               <span className="text-[14px] font-black uppercase tracking-[0.6em] text-gold group-hover:text-white transition-colors leading-none">Season Rankings</span>
               <ArrowRight size={24} className="text-gold group-hover:translate-x-1 transition-all" />
            </Link>
         </motion.div>
      </footer>
    </div>
  );
}
