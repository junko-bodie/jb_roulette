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

  // Force allow scrolling on this page specifically (overriding global body overflow)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
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
      className="min-h-screen w-full flex flex-col items-center selection:bg-gold/20 selection:text-gold"
      style={{ 
        background: `radial-gradient(circle at 50% -20%, ${COLORS.deepGreen} 0%, ${COLORS.black} 100%)`
      }}
    >
      
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <nav className="w-full bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 flex justify-center">
        <div className="w-full max-w-7xl px-12 h-20 flex items-center justify-between">
          <Link href="/lobby" className="flex items-center gap-4 text-white/40 hover:text-white transition-colors group min-w-[120px]">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[13px] font-black uppercase tracking-[0.3em]">Lobby</span>
          </Link>

          <div className="flex flex-col items-center text-center">
             <h1 className="text-[13px] font-black uppercase tracking-[0.5em] text-white/40 mb-1">Global Wealth</h1>
             <div className="flex items-center gap-3">
               <Globe size={12} className="text-gold/50" />
               <span className="text-[11px] font-black text-gold uppercase tracking-[0.4em]">Worldwide Registry</span>
             </div>
          </div>

          <div className="flex items-center gap-10 min-w-[120px] justify-end">
            <Link href="/rankings" className="text-[13px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-colors">Season Pts</Link>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <User size={20} className="text-white/20" />
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-5xl px-10 py-16 flex flex-col items-center">
        
        {/* ═══ LEADERBOARD HEADER (COMPACT) ═══ */}
        <div className="flex flex-col items-center mb-12 text-center w-full">
          <div className="flex items-center gap-5 mb-4 justify-center">
             <Users size={32} className="text-gold/40" />
             <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-white/95 leading-none">Wealth Registry</h2>
          </div>
          <div className="flex flex-col items-center gap-4">
             <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.4em] max-w-xl leading-loose">
               Registry of verified asset equity across the global network.
             </p>
             <div className="flex items-center gap-3 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <span className="text-[11px] font-black text-emerald-500/80 uppercase tracking-[0.4em]">Protocol Sync Active</span>
             </div>
          </div>
        </div>

        {/* ═══ DATA TABLE (COMPACT ROWS & HORIZONTAL LAYOUT) ═══ */}
        <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden mb-20">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.05]">
                <th className="py-6 px-12 text-[12px] font-black uppercase tracking-[0.5em] text-white/40 w-24 text-center">Rank</th>
                <th className="py-6 px-4 text-[12px] font-black uppercase tracking-[0.5em] text-white/40 text-left">Contender</th>
                <th className="py-6 px-4 text-[12px] font-black uppercase tracking-[0.5em] text-white/40 text-center">Tier</th>
                <th className="py-6 px-4 text-[12px] font-black uppercase tracking-[0.5em] text-white/40 text-center hidden sm:table-cell">Status</th>
                <th className="py-6 px-12 text-[12px] font-black uppercase tracking-[0.5em] text-white/40 text-right">Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
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
                      isMe ? 'bg-gold/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="py-6 px-12 text-center">
                       <span className={`text-3xl font-black italic tabular-nums leading-none ${
                         isGold ? 'text-gold' : 
                         isSilver ? 'text-slate-300' : 
                         isBronze ? 'text-amber-600' : 
                         isMe ? 'text-gold' : 'text-white/10'
                       }`} style={{ fontFamily: FONTS.primary }}>
                         {player.rank}
                       </span>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-xl bg-white/[0.05] border-2 flex items-center justify-center transition-all overflow-hidden ${
                          isMe ? 'border-gold shadow-[0_0_15px_rgba(201,168,76,0.2)]' : 'border-white/10 group-hover:border-white/30'
                        }`}>
                          <img src={player.avatar || '/avatars/default.png'} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className={`text-base font-black uppercase tracking-wider ${isMe ? 'text-gold' : 'text-white/90'}`}>
                              {player.name}
                            </span>
                            {player.is_pro && (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                            Verified Asset Holder
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                       <div className="flex justify-center">
                         {player.balance > 100000 ? (
                            <div className="px-3 py-1 bg-gold/10 border border-gold/30 rounded-lg text-[10px] font-black text-gold uppercase tracking-widest">Grandmaster</div>
                         ) : player.balance > 10000 ? (
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white/30 uppercase tracking-widest">Veteran</div>
                         ) : (
                            <div className="px-3 py-1 bg-white/[0.02] border border-white/[0.03] rounded-lg text-[10px] font-black text-white/10 uppercase tracking-widest">Rookie</div>
                         )}
                       </div>
                    </td>
                    <td className="py-6 px-4 hidden sm:table-cell">
                       <div className="flex items-center justify-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                          <TrendingUp size={16} className="text-emerald-500" />
                          <span className="text-[10px] font-black tabular-nums tracking-widest uppercase">Stable</span>
                       </div>
                    </td>
                    <td className="py-6 px-12 text-right">
                       <span className={`text-3xl font-black tabular-nums leading-none ${isMe ? 'text-gold' : 'text-white'}`} style={{ fontFamily: FONTS.primary }}>
                         ${player.balance.toLocaleString()}
                       </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ═══ FOOTER INFO (CENTERED) ═══ */}
        <div className="flex flex-col items-center gap-10 text-center pb-40 w-full opacity-30 hover:opacity-100 transition-opacity">
           <p className="text-[11px] font-black text-white uppercase tracking-[0.5em] max-w-xl leading-loose">
             Authorized and maintained by the Junko Bodie Global Protocol.
           </p>
           <div className="flex items-center gap-16 justify-center">
              <div className="flex items-center gap-4 group">
                 <div className="w-3 h-3 rounded-full bg-gold shadow-[0_0_10px_rgba(201,168,76,0.6)]" />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Qualified Tier</span>
              </div>
              <div className="flex items-center gap-4 group">
                 <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Contender Field</span>
              </div>
           </div>
        </div>
      </main>

      {/* ═══ FLOATING ACTION BAR (CENTERED) ═══ */}
      <footer className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-black/80 backdrop-blur-3xl border border-white/10 px-12 py-6 rounded-2xl flex items-center gap-12 shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
         >
            <div className="flex items-center gap-4">
               <Star size={18} className="text-gold animate-pulse" />
               <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/50 italic leading-none">Global Assets</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <Link href="/rankings" className="group flex items-center gap-4">
               <span className="text-[11px] font-black uppercase tracking-[0.5em] text-gold group-hover:text-white transition-colors leading-none">Season Rankings</span>
               <ArrowRight size={18} className="text-gold group-hover:translate-x-1 transition-all" />
            </Link>
         </motion.div>
      </footer>
    </div>
  );
}
