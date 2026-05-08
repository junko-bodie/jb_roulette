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

  // Force allow scrolling on this page specifically (overriding global body overflow)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
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
      className="min-h-screen w-full flex flex-col items-center selection:bg-gold/20 selection:text-gold"
      style={{ 
        background: `radial-gradient(circle at 50% -20%, ${COLORS.deepGreen} 0%, #08100d 100%)`
      }}
    >
      
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <nav className="w-full bg-black/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-12 h-14 sm:h-20 flex items-center justify-between">
          <Link href="/lobby" className="flex items-center gap-2 sm:gap-4 text-white/40 hover:text-white transition-colors group min-w-0 sm:min-w-[120px]">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform flex-shrink-0" />
            <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Lobby</span>
          </Link>

          <div className="flex flex-col items-center text-center">
             <h1 className="text-[10px] sm:text-[13px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/40 mb-0.5 sm:mb-1">Season Rankings</h1>
             <span className="text-[9px] sm:text-[11px] font-black text-gold uppercase tracking-[0.2em] sm:tracking-[0.3em]">{year} Championship</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-10 min-w-0 sm:min-w-[120px] justify-end">
            <Link href="/season" className="text-[10px] sm:text-[13px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 hover:text-gold transition-colors whitespace-nowrap">Global Wealth</Link>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
               <User size={16} className="text-white/20 sm:hidden" />
               <User size={20} className="text-white/20 hidden sm:block" />
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-5xl px-4 sm:px-10 py-8 sm:py-16 flex flex-col items-center">
        
        {/* ═══ USER SUMMARY CARD (COMPACT) ═══ */}
        {myEntry && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8 sm:mb-16 p-5 sm:p-10 bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gold/[0.02] to-transparent pointer-events-none" />

            <div className="flex flex-col items-center gap-8 relative z-10 w-full">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-16 justify-center w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/30 mb-1 sm:mb-2">Position</span>
                  <span className="text-3xl sm:text-5xl font-black text-white italic leading-none" style={{ fontFamily: FONTS.primary }}>
                    #{myEntry.rank}
                  </span>
                </div>
                
                <div className="h-px w-16 sm:h-12 sm:w-px bg-white/10" />
                
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/30 mb-1 sm:mb-2">Total Points</span>
                  <span className="text-3xl sm:text-5xl font-black text-gold leading-none" style={{ fontFamily: FONTS.primary }}>
                    {myEntry.points.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className={`px-8 py-3 rounded-xl border text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3 ${
                isQualified 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}>
                {isQualified ? (
                  <>
                    <ShieldCheck size={16} />
                    Championship Qualified
                  </>
                ) : (
                  <>
                    <Target size={16} />
                    Outside Zone
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ LEADERBOARD HEADER (COMPACT) ═══ */}
        <div className="flex flex-col items-center mb-6 sm:mb-12 text-center w-full">
          <div className="flex items-center gap-3 sm:gap-5 mb-2 sm:mb-4 justify-center">
             <Trophy size={18} className="text-gold/50 sm:hidden" />
             <Trophy size={24} className="text-gold/50 hidden sm:block" />
             <h2 className="text-xl sm:text-3xl font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/95 leading-none">Elite Registry</h2>
          </div>
          <div className="flex items-center gap-4 sm:gap-8 w-full justify-center">
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
            <span className="text-[9px] sm:text-[11px] font-black text-white/20 uppercase tracking-[0.3em] sm:tracking-[0.6em] whitespace-nowrap italic">Global Protocol Sync Active</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
        </div>

        {/* ═══ DATA TABLE ═══ */}
        <div className="w-full bg-white/[0.02] border border-white/10 rounded-xl sm:rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden mb-20">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.05]">
                <th className="py-3 sm:py-6 px-3 sm:px-12 text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white/40 w-12 sm:w-24 text-center">Rank</th>
                <th className="py-3 sm:py-6 px-2 sm:px-4 text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white/40 text-left">Contender</th>
                <th className="py-3 sm:py-6 px-2 sm:px-4 text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white/40 text-center hidden sm:table-cell">Status</th>
                <th className="py-3 sm:py-6 px-2 sm:px-4 text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white/40 text-center hidden md:table-cell">Activity</th>
                <th className="py-3 sm:py-6 px-3 sm:px-12 text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] text-white/40 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
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
                    transition={{ delay: Math.min(idx * 0.04, 0.8) }}
                    className={`group transition-all ${
                      isMe ? 'bg-gold/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="py-3 sm:py-6 px-3 sm:px-12 text-center">
                       <span className={`text-lg sm:text-3xl font-black italic tabular-nums leading-none ${
                         isGold ? 'text-gold' : 
                         isSilver ? 'text-slate-400' : 
                         isBronze ? 'text-amber-700' : 
                         isMe ? 'text-gold' : 'text-white/10'
                       }`} style={{ fontFamily: FONTS.primary }}>
                         {entry.rank}
                       </span>
                    </td>
                    <td className="py-3 sm:py-6 px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-6">
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/[0.05] border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isMe ? 'border-gold shadow-[0_0_15px_rgba(201,168,76,0.2)]' : 'border-white/10 group-hover:border-white/30'
                        }`}>
                          {isGold ? <Award size={20} className="text-gold" /> : <User size={16} className={`${isMe ? 'text-gold' : 'text-white/20'} sm:hidden`} />}
                          {!isGold && <User size={20} className={`${isMe ? 'text-gold' : 'text-white/20'} hidden sm:block`} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs sm:text-base font-black uppercase tracking-wider truncate ${isMe ? 'text-gold' : 'text-white/90'}`}>
                            {entry.username}
                          </span>
                          <span className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                            Season Competitor
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-6 px-2 sm:px-4 text-center hidden sm:table-cell">
                       <div className="flex justify-center">
                         {isElite ? (
                           <div className="px-2 sm:px-3 py-1 bg-gold/10 border border-gold/30 rounded-lg text-[8px] sm:text-[10px] font-black text-gold uppercase tracking-widest">Qualified</div>
                         ) : (
                           <div className="px-2 sm:px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest">Field</div>
                         )}
                       </div>
                    </td>
                    <td className="py-3 sm:py-6 px-2 sm:px-4 text-center hidden md:table-cell">
                      <span className="text-xs font-black text-white/20 tabular-nums uppercase tracking-widest">
                        {entry.tournaments_played} GMS
                      </span>
                    </td>
                    <td className="py-3 sm:py-6 px-3 sm:px-12 text-right">
                       <span className={`text-lg sm:text-3xl font-black tabular-nums leading-none ${isElite ? 'text-white' : 'text-white/30'}`} style={{ fontFamily: FONTS.primary }}>
                         {entry.points.toLocaleString()}
                       </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ═══ FOOTER INFO (MASSIVE PADDING TO AVOID FOOTER OVERLAP) ═══ */}
        <div className="flex flex-col items-center gap-10 text-center pb-[300px] w-full opacity-30 hover:opacity-100 transition-opacity">
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

      {/* ═══ BOTTOM GRADIENT FOG (Hides content behind footer) ═══ */}
      <div className="fixed bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-40" />

      {/* ═══ FLOATING ACTION BAR ═══ */}
      <footer className="fixed bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] sm:w-auto max-w-lg sm:max-w-none">
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-black/90 backdrop-blur-3xl border border-white/20 px-4 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl flex items-center justify-center gap-4 sm:gap-12 shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
         >
            <div className="flex items-center gap-2 sm:gap-4">
               <Star size={14} className="text-gold animate-pulse sm:hidden" />
               <Star size={18} className="text-gold animate-pulse hidden sm:block" />
               <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/50 italic leading-none">Pro Series</span>
            </div>
            <div className="h-4 sm:h-6 w-px bg-white/10" />
            <Link href="/lobby" className="group flex items-center gap-2 sm:gap-4">
               <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-gold group-hover:text-white transition-colors leading-none">Enter Championship</span>
               <ArrowRight size={14} className="text-gold group-hover:translate-x-1 transition-all sm:hidden" />
               <ArrowRight size={18} className="text-gold group-hover:translate-x-1 transition-all hidden sm:block" />
            </Link>
         </motion.div>
      </footer>
    </div>
  );
}
