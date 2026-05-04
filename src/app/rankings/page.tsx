'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Star, ChevronLeft, ArrowRight, User, ShieldCheck, Target, Globe, Award } from 'lucide-react';
import Link from 'next/link';
import { COLORS, FONTS } from '@/styles/theme';

export default function RankingsPage() {
  const { user } = useGame();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchRankings() {
      try {
        const res = await fetch('/api/season/rankings');
        if (!res.ok) throw new Error('Failed to fetch rankings');
        const data = await res.json();
        const sorted = (data.rankings || []).sort((a: any, b: any) => b.points - a.points);
        setRankings(sorted);
        setYear(data.year);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, []);

  const myEntry = rankings.find(r => r.player_id === user?.id || r.username === user?.email?.split('@')[0]);
  const isQualified = myEntry && myEntry.rank <= 50;

  if (loading) {
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
             <h1 className="text-[14px] font-black uppercase tracking-[0.6em] text-white/40 mb-1">Season Rankings</h1>
             <span className="text-[12px] font-black text-gold uppercase tracking-[0.4em]">{year} Championship</span>
          </div>

          <div className="flex items-center gap-10 min-w-[120px] justify-end">
            <Link href="/season" className="text-[14px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-colors">Global Wealth</Link>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <User size={24} className="text-white/20" />
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-5xl px-10 py-24 flex flex-col items-center">
        
        {/* ═══ USER SUMMARY CARD (EXPLICIT CENTERING) ═══ */}
        {myEntry && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-24 p-16 bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gold/[0.02] to-transparent pointer-events-none" />

            <div className="flex flex-col items-center gap-12 relative z-10 w-full">
              <div className="flex items-center gap-20 justify-center w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[13px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Rank Position</span>
                  <span className="text-7xl font-black text-white italic leading-none tracking-tighter" style={{ fontFamily: FONTS.primary }}>
                    #{myEntry.rank}
                  </span>
                </div>
                
                <div className="h-20 w-px bg-white/10" />
                
                <div className="flex flex-col items-center">
                  <span className="text-[13px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Total Points</span>
                  <span className="text-7xl font-black text-gold leading-none tracking-tighter" style={{ fontFamily: FONTS.primary }}>
                    {myEntry.points.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className={`px-10 py-5 rounded-2xl border text-[13px] font-black uppercase tracking-[0.4em] flex items-center gap-4 ${
                  isQualified 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {isQualified ? (
                    <>
                      <ShieldCheck size={20} />
                      Championship Zone Qualified
                    </>
                  ) : (
                    <>
                      <Target size={20} />
                      Outside Qualifying Zone
                    </>
                  )}
                </div>
                
                {!isQualified && (
                  <p className="text-[13px] font-black text-white/20 uppercase tracking-[0.3em] italic max-w-lg leading-relaxed">
                    Accumulate points through tournament participation to secure your position.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ LEADERBOARD HEADER (CENTERED) ═══ */}
        <div className="flex flex-col items-center mb-20 text-center w-full">
          <div className="flex items-center gap-5 mb-5 justify-center">
             <Globe size={32} className="text-gold/50" />
             <h2 className="text-4xl font-black uppercase tracking-[0.5em] text-white/95 leading-none">Elite Registry</h2>
          </div>
          <div className="flex items-center gap-8 w-full justify-center">
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
            <span className="text-[13px] font-black text-white/20 uppercase tracking-[0.6em] whitespace-nowrap">Global Data Protocol</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
        </div>

        {/* ═══ DATA TABLE (CENTERED & PREVENTING CLIPPING) ═══ */}
        <div className="w-full bg-white/[0.02] border border-white/10 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.05]">
                {/* Massive padding on edges (px-20) to prevent clipping by the rounded container */}
                <th className="py-12 px-20 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 w-32 text-center">Rank</th>
                <th className="py-12 px-10 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center">Contender</th>
                <th className="py-12 px-10 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center">Zone</th>
                <th className="py-12 px-10 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center hidden sm:table-cell">Activity</th>
                <th className="py-12 px-20 text-[14px] font-black uppercase tracking-[0.6em] text-white/40 text-center">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rankings.map((entry, idx) => {
                const isMe = entry.username === user?.email?.split('@')[0];
                const isGold = entry.rank === 1;
                const isSilver = entry.rank === 2;
                const isBronze = entry.rank === 3;
                const isElite = entry.rank <= 50;

                return (
                  <motion.tr 
                    key={idx}
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
                         {entry.rank}
                       </span>
                    </td>
                    <td className="py-12 px-10">
                      <div className="flex flex-col items-center gap-6 justify-center">
                        <div className={`w-20 h-20 rounded-2xl bg-white/[0.05] border-2 flex items-center justify-center transition-all ${
                          isMe ? 'border-gold shadow-[0_0_20px_rgba(201,168,76,0.3)]' : 'border-white/10 group-hover:border-white/40'
                        }`}>
                          {isGold ? <Award size={40} className="text-gold" /> : <User size={32} className={isMe ? 'text-gold' : 'text-white/30'} />}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`text-2xl font-black uppercase tracking-widest ${isMe ? 'text-gold' : 'text-white/95'}`}>
                            {entry.username}
                          </span>
                          <span className="text-[13px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">
                            {entry.tournaments_won > 0 ? `${entry.tournaments_won} Wins` : 'Sanctioned Pro'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-12 px-10 text-center">
                      <div className="flex justify-center">
                        {isElite ? (
                          <div className="group/status relative">
                             <div className="w-5 h-5 rounded-full bg-gold shadow-[0_0_25px_rgba(201,168,76,1)]" />
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border-2 border-gold/20 rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/10" />
                        )}
                      </div>
                    </td>
                    <td className="py-12 px-10 text-center hidden sm:table-cell">
                      <span className="text-base font-black text-white/30 tabular-nums uppercase tracking-[0.3em]">
                        {entry.tournaments_played} GMS
                      </span>
                    </td>
                    <td className="py-12 px-20 text-center">
                       <span className={`text-5xl font-black tabular-nums leading-none ${isElite ? 'text-white' : 'text-white/20'}`} style={{ fontFamily: FONTS.primary }}>
                         {entry.points.toLocaleString()}
                       </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {rankings.length === 0 && (
            <div className="py-48 text-center flex flex-col items-center gap-12">
               <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center opacity-20">
                 <Trophy size={48} className="text-white" />
               </div>
               <span className="text-[16px] font-black uppercase tracking-[0.7em] text-white/20 italic">Awaiting Season Commencement</span>
            </div>
          )}
        </div>

        {/* ═══ FOOTER INFO (CENTERED) ═══ */}
        <div className="mt-24 flex flex-col items-center gap-12 text-center pb-48 w-full">
           <p className="text-[13px] font-black text-white/10 uppercase tracking-[0.7em] max-w-2xl leading-loose">
             Authorized and maintained by the Junko Bodie Global Protocol.
           </p>
           <div className="flex items-center gap-20 justify-center">
              <div className="flex items-center gap-6 group">
                 <div className="w-4 h-4 rounded-full bg-gold shadow-[0_0_15px_rgba(201,168,76,0.6)] group-hover:scale-125 transition-transform" />
                 <span className="text-[13px] font-black text-white/30 uppercase tracking-[0.5em] group-hover:text-gold transition-colors">Elite Qualifier Tier</span>
              </div>
              <div className="flex items-center gap-6 group">
                 <div className="w-3.5 h-3.5 rounded-full bg-white/10 group-hover:scale-125 transition-transform" />
                 <span className="text-[13px] font-black text-white/30 uppercase tracking-[0.5em] group-hover:text-white/60 transition-colors">Contender Field</span>
              </div>
           </div>
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
               <span className="text-[14px] font-black uppercase tracking-[0.6em] text-white/50 italic leading-none">Pro Series</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <Link href="/lobby" className="group flex items-center gap-6">
               <span className="text-[14px] font-black uppercase tracking-[0.6em] text-gold group-hover:text-white transition-colors leading-none">Compete Now</span>
               <ArrowRight size={24} className="text-gold group-hover:translate-x-1 transition-all" />
            </Link>
         </motion.div>
      </footer>
    </div>
  );
}
