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
import Avatar from '@/components/ui/Avatar';
import styles from '@/app/tournament/tournament.module.css';


export default function RankingsPage() {
  const { user, userProfile } = useGame();
  const router = useRouter();
  const [rankings, setRankings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter and Search Logic
  const filteredRankings = rankings
    .filter(r => r.points >= 0) // Exclude negative points as requested
    .filter(r => {
      const search = searchQuery.toLowerCase();
      if (!search) return true;
      return (
        (r.username || '').toLowerCase().includes(search) ||
        r.player_id?.toString() === search
      );
    });

  // Use profile ID from context to match database records
  const myIdStr = userProfile?.id?.toString();
  const myIndex = rankings.findIndex(r => 
    r.player_id?.toString() === myIdStr || 
    (r.username && r.username === userProfile?.name)
  );
  const myEntry = myIndex !== -1 ? rankings[myIndex] : null;
  const myRank = myIndex !== -1 ? myIndex + 1 : 0;
  const isQualified = myRank > 0 && myRank <= 50;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8d9b8]">
        <div className="text-[#0f2318] font-bold tracking-widest uppercase">Syncing Registry...</div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => router.push('/lobby')}
            className={styles.backBtn}
            title="Back to Lobby"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className={styles.logoGroup}>
            <span className={styles.logoText}>JUNKO BODIE</span>
            <span className={styles.logoSeparator}>|</span>
            <span className={styles.logoSub}>Elite Registry {year}</span>
          </div>
        </div>
        <div /> {/* Spacer for flex-between */}
      </header>

      <main className={styles.main} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 h-full overflow-hidden">
          
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
               
               <div className={styles.cardContent} style={{ padding: '24px' }}>
                 <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                       <Avatar 
                          type={userProfile?.avatar || 'default'} 
                          size="lg" 
                          className="border-2 border-[#c9a44c] shadow-lg" 
                       />
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
                          <span className="text-4xl font-bold text-[#b8892e]" style={{ fontFamily: 'Georgia, serif' }}>#{myRank}</span>
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

          {/* ═══ REGISTRY REGISTRY CARD ═══ */}
          <motion.div 
            className={`${styles.card} flex-1 flex flex-col overflow-hidden mb-2`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
             <div className={styles.cornerTL} />
             <div className={styles.cornerTR} />
             <div className={styles.cornerBL} />
             <div className={styles.cornerBR} />
             
             <div className={`${styles.cardContent} flex-1 flex flex-col overflow-hidden`} style={{ padding: '0' }}>
               {/* Header Section - COMPACT */}
               <div className="w-full bg-[#0f2318] border-b border-[#c9a44c]/30 p-6 flex flex-col items-center">
                 <div className="flex items-center gap-3 mb-1">
                    <Trophy size={18} className="text-[#c9a44c]" />
                    <h2 className="text-xl md:text-2xl font-bold text-[#f2e8d0] uppercase tracking-[0.3em] m-0" style={{ fontFamily: 'Georgia, serif' }}>
                      The Elite Registry
                    </h2>
                 </div>
                 <p className="text-[9px] font-bold text-[#c9a44c]/60 uppercase tracking-[0.4em] mb-4">Official {year} Season Standings</p>
                 
                 <div className="flex gap-12 mb-6">
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-[9px] font-bold text-[#c9a44c]/60 uppercase tracking-[0.2em]">Total Contenders</span>
                       <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{rankings.length.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-10 bg-[#c9a44c]/20" />
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-[9px] font-bold text-[#c9a44c]/60 uppercase tracking-[0.2em]">Registry Count</span>
                       <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{filteredRankings.length.toLocaleString()}</span>
                    </div>
                 </div>

                 {/* Search Bar */}
                 <div className="w-full max-w-lg relative group px-4 sm:px-0">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#c9a44c] z-10">
                      <Target size={20} strokeWidth={2.5} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search Contender Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#1a2e23] border-2 border-[#c9a44c]/30 rounded-2xl py-3 pr-6 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a44c] focus:bg-[#1d3327] transition-all tracking-wider shadow-2xl"
                      style={{ paddingLeft: '72px' }}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-6 flex items-center text-white/30 hover:text-white transition-colors"
                      >
                        <History size={16} />
                      </button>
                    )}
                 </div>
               </div>
 
               {/* Table Wrapper with Flex-1 for scrollability */}
               <div className={`w-full flex-1 overflow-y-auto ${styles.customScrollbar} bg-white/5`}>
                <table className={`w-full border-collapse ${styles.stickyTable}`}>
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
                    {filteredRankings.length > 0 ? filteredRankings.map((entry) => {
                      // Find actual global rank from original rankings array using string ID comparison
                      const globalRank = rankings.findIndex(r => r.player_id?.toString() === entry.player_id?.toString()) + 1;
                      const displayRank = globalRank;
                      const myIdStr = userProfile?.id?.toString();
                      const isMe = entry.player_id?.toString() === myIdStr || (entry.username && entry.username === userProfile?.name);
                      const isTop3 = displayRank <= 3;
                      const isElite = displayRank <= 50;

                      return (
                        <tr 
                          key={entry.player_id} 
                          className={`group transition-all ${isMe ? 'bg-[#c9a44c]/10' : 'hover:bg-[#c9a44c]/5'}`}
                        >
                          <td className="py-6 px-8 text-center">
                            <span className={`text-2xl font-bold italic tabular-nums ${
                              isTop3 ? 'text-[#b8892e]' : isMe ? 'text-[#0f2318]' : 'text-[#0f2318]/20'
                            }`} style={{ fontFamily: 'Georgia, serif' }}>
                              {displayRank}
                            </span>
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-4">
                                <Avatar 
                                   type={isMe ? (userProfile?.avatar || entry.avatar_url || 'default') : (entry.avatar_url || entry.avatar || (['crown', 'diamond', 'star', 'spade', 'heart', 'club', 'dice', 'chip', 'trophy', 'bolt'][displayRank % 10]))} 
                                   size="md"
                                   className={isMe ? 'border-[#c9a44c]' : 'border-black/5'}
                                />
                               <div className="flex flex-col">
                                  <span className={`text-sm font-bold uppercase tracking-wider ${isMe ? 'text-[#0f2318]' : 'text-[#0f2318]/80'}`}>
                                    {entry.username || 'Anonymous Contender'}
                                  </span>
                                  <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest mt-0.5">
                                    {isMe ? 'Official Profile' : 'Season Participant'}
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
                    }) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4 opacity-30">
                              <Target size={48} className="text-[#0f2318]" />
                              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0f2318]">No Contenders Found</span>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Registry Note */}
              <div className="p-4 bg-[#f5edd5] border-t border-[#c9a44c]/20 flex flex-col items-center gap-3 opacity-40">
                 <p className="text-[9px] font-bold text-[#0f2318] uppercase tracking-[0.4em] text-center leading-relaxed m-0">
                   Official record of the Junko Bodie Global Protocol. Access restricted to authorized contenders.
                 </p>
                 <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#c9a44c]" />
                       <span className="text-[8px] font-bold uppercase tracking-widest">Elite (Top 50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                       <span className="text-[8px] font-bold uppercase tracking-widest">Field</span>
                    </div>
                 </div>
              </div>

              {/* Status Bar - Integrated into Card */}
              {myEntry && (
                <div className="bg-[#0f2318] p-4 flex items-center justify-between gap-6 border-t border-[#c9a44c]/40">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center text-[#c9a44c]">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#c9a44c]/50 uppercase tracking-[0.3em] block mb-0.5">Your Position</span>
                        <span className="text-lg font-bold text-white tracking-widest uppercase">Rank #{myRank}</span>
                      </div>
                  </div>
                  
                  <div className="h-8 w-px bg-white/10" />

                  <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-[#c9a44c]/50 uppercase tracking-[0.3em] block mb-0.5">
                        {myRank > 50 ? 'Points to Elite' : myRank > 1 ? 'Next Rank In' : 'Status'}
                      </span>
                      <span className="text-lg font-bold text-[#c9a44c] tabular-nums">
                        {myRank === 0 ? '---' : 
                        myRank === 1 ? 'Championship' : 
                        myRank > 50 ? 
                        `+${Math.max(0, (rankings[49]?.points || 0) - myEntry.points + 1).toLocaleString()} pts` : 
                        `+${Math.max(0, (rankings[myRank - 2]?.points || 0) - myEntry.points + 1).toLocaleString()} pts`
                        }
                      </span>
                  </div>
                </div>
              )}
             </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
