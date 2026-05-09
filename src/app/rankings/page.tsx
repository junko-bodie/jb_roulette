'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { 
  Trophy, 
  Star, 
  ChevronLeft, 
  User, 
  ShieldCheck, 
  Target, 
  Award,
  ArrowUpRight,
  TrendingUp,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/app/tournament/tournament.module.css';


export default function RankingsPage() {
  const { user, userProfile } = useGame();
  const router = useRouter();
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
      <div className="min-h-screen flex items-center justify-center bg-[#e8d9b8]">
        <div className="text-[#0f2318] font-bold tracking-widest uppercase">Syncing Registry...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <span className={styles.logoText}>JUNKO BODIE</span>
          <span className={styles.logoSeparator}>|</span>
          <span className={styles.logoSub}>Elite Registry {year}</span>
        </div>
        <button className={styles.signOutBtn} onClick={() => router.push('/lobby')}>
          Return to Lobby
        </button>
      </header>

      <main className={styles.main}>
        <div className="w-full max-w-6xl flex flex-col gap-8">
          
          {/* ═══ MY STANDING CARD (Tournament Style) ═══ */}
          {myEntry && (
            <motion.div 
              className={styles.card}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
               <div className={styles.cornerTL} />
               <div className={styles.cornerTR} />
               <div className={styles.cornerBL} />
               <div className={styles.cornerBR} />
               
               <div className={styles.cardContent} style={{ padding: '32px' }}>
                 <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 rounded-full bg-[#0f2318] flex items-center justify-center border-2 border-[#c9a44c] text-[#c9a44c] shadow-lg">
                          <User size={32} />
                       </div>
                       <div>
                          <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1">Your Standing</span>
                          <h2 className="text-3xl font-bold text-[#0f2318]" style={{ fontFamily: 'Georgia, serif' }}>
                            {userProfile?.name || 'Player One'}
                          </h2>
                       </div>
                    </div>

                    <div className="flex gap-12">
                       <div className="text-center">
                          <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1">Global Rank</span>
                          <span className="text-4xl font-bold text-[#b8892e]" style={{ fontFamily: 'Georgia, serif' }}>#{myEntry.rank}</span>
                       </div>
                       <div className="text-center">
                          <span className="text-[10px] font-bold text-[#8b6914] uppercase tracking-widest block mb-1">Total Points</span>
                          <span className="text-4xl font-bold text-[#0f2318]" style={{ fontFamily: 'Georgia, serif' }}>{myEntry.points.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className={`px-6 py-3 rounded-lg border flex items-center gap-3 ${
                      isQualified 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {isQualified ? <ShieldCheck size={18} /> : <Target size={18} />}
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {isQualified ? 'Championship Qualified' : 'Outside Qualification Zone'}
                      </span>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}

          {/* ═══ THE REGISTRY LEDGER ═══ */}
          <div className={styles.card}>
            <div className={styles.cornerTL} />
            <div className={styles.cornerTR} />
            <div className={styles.cornerBL} />
            <div className={styles.cornerBR} />
            
            <div className={styles.cardContent} style={{ padding: '0' }}>
              {/* Ledger Header */}
              <div className="w-full bg-[#0f2318] text-[#f2e8d0] p-8 flex flex-col items-center">
                 <div className="flex items-center gap-4 mb-2">
                    <Trophy size={24} className="text-[#c9a44c]" />
                    <h2 className="text-2xl font-bold tracking-[0.2em] uppercase" style={{ fontVariant: 'small-caps' }}>The Elite Registry</h2>
                 </div>
                 <span className="text-[10px] font-bold text-[#c9a44c]/60 uppercase tracking-[0.4em]">Official 2024 Season Standings</span>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#c9a44c]/20 bg-[#f5edd5]">
                      <th className="py-6 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b6914] text-center w-24">Rank</th>
                      <th className="py-6 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b6914] text-left">Contender</th>
                      <th className="py-6 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b6914] text-center hidden sm:table-cell">Tier</th>
                      <th className="py-6 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b6914] text-center hidden md:table-cell">Activity</th>
                      <th className="py-6 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b6914] text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c9a44c]/10 bg-white/40">
                    {rankings.map((entry, idx) => {
                      const isMe = entry.player_id === user?.id || entry.username === user?.email?.split('@')[0];
                      const isTop3 = entry.rank <= 3;
                      const isElite = entry.rank <= 50;

                      return (
                        <tr 
                          key={idx} 
                          className={`group transition-all ${isMe ? 'bg-[#c9a44c]/10' : 'hover:bg-[#c9a44c]/5'}`}
                        >
                          <td className="py-6 px-8 text-center">
                            <span className={`text-2xl font-bold italic tabular-nums ${
                              isTop3 ? 'text-[#b8892e]' : isMe ? 'text-[#0f2318]' : 'text-[#0f2318]/20'
                            }`} style={{ fontFamily: 'Georgia, serif' }}>
                              {entry.rank}
                            </span>
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                                 isMe ? 'bg-[#0f2318] border-[#c9a44c] text-[#c9a44c]' : 'bg-white border-black/5 text-black/20'
                               }`}>
                                  {isTop3 ? <Award size={20} /> : <User size={18} />}
                               </div>
                               <div className="flex flex-col">
                                  <span className={`text-sm font-bold uppercase tracking-wider ${isMe ? 'text-[#0f2318]' : 'text-[#0f2318]/80'}`}>
                                    {entry.username}
                                  </span>
                                  <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest mt-0.5">
                                    Season Participant
                                  </span>
                               </div>
                            </div>
                          </td>
                          <td className="py-6 px-4 text-center hidden sm:table-cell">
                             {isElite ? (
                               <div className="inline-flex px-3 py-1 bg-[#c9a44c]/10 border border-[#c9a44c]/30 rounded-full text-[9px] font-black text-[#8b6914] uppercase tracking-widest">Elite Tier</div>
                             ) : (
                               <div className="inline-flex px-3 py-1 bg-black/5 border border-black/10 rounded-full text-[9px] font-black text-black/30 uppercase tracking-widest">Field</div>
                             )}
                          </td>
                          <td className="py-6 px-4 text-center hidden md:table-cell">
                             <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-black/40 tabular-nums uppercase">
                                  {entry.tournaments_played} Events
                                </span>
                             </div>
                          </td>
                          <td className="py-6 px-8 text-right">
                             <span className={`text-2xl font-bold tabular-nums ${isElite ? 'text-[#0f2318]' : 'text-[#0f2318]/30'}`} style={{ fontFamily: 'Georgia, serif' }}>
                               {entry.points.toLocaleString()}
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Registry Note */}
              <div className="p-12 bg-[#f5edd5] border-t border-[#c9a44c]/20 flex flex-col items-center gap-6 opacity-40">
                 <p className="text-[10px] font-bold text-[#0f2318] uppercase tracking-[0.5em] text-center leading-loose">
                   This ledger is an official record of the Junko Bodie Global Protocol. <br/> Access is restricted to authorized personnel and active contenders.
                 </p>
                 <div className="flex gap-12">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-[#c9a44c]" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Qualified Zone (Top 50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-black/20" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Contender Field</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Status Bar (Always Visible) */}
      {myEntry && (
        <motion.div 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
           <div className="bg-[#0f2318] border border-[#c9a44c]/40 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center text-[#c9a44c]">
                    <TrendingUp size={20} />
                 </div>
                 <div>
                    <span className="text-[9px] font-bold text-[#c9a44c]/50 uppercase tracking-[0.3em] block mb-0.5">Your Position</span>
                    <span className="text-lg font-bold text-white tracking-widest uppercase">Rank #{myEntry.rank}</span>
                 </div>
              </div>
              
              <div className="h-8 w-px bg-white/10" />

              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-bold text-[#c9a44c]/50 uppercase tracking-[0.3em] block mb-0.5">Next Tier In</span>
                 <span className="text-lg font-bold text-gold tabular-nums">+850 pts</span>
              </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}
