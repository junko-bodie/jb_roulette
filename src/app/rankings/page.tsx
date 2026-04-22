'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Medal, Star, ChevronUp, ChevronDown, User, Crown, Info } from 'lucide-react';
import Link from 'next/link';

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
        setRankings(data.rankings || []);
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
  // Note: in a real app, I'd fetch my profile to get my MongoDB ID, but here we can check by player_id if it matched session.user.id or use a fallback.
  // Actually, the rankings stored player_id which is a MongoDB ObjectId string.
  
  const top50Threshold = rankings[49]?.points || 0;
  const pointsTo50 = myEntry && myEntry.rank > 50 ? top50Threshold - myEntry.points + 1 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050d0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050d0a] text-white pb-24" style={{ background: `radial-gradient(circle at 50% 0%, #1a4d3c 0%, #050d0a 100%)` }}>
      
      {/* ═══ HEADER ═══ */}
      <header className="pt-20 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-gold/10 border border-gold/20 rounded-full mb-6">
            <Star size={16} className="text-gold fill-gold" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gold">Season {year} Hall of Fame</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 italic">
            WORLD <span className="text-gold">RANKINGS</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/40 font-bold uppercase tracking-widest text-sm leading-loose">
            The top 50 players at year-end qualify for the <span className="text-white">Junko Bodie Annual Championship.</span>
          </p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        
        {/* ═══ USER STATUS CARD ═══ */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-8 bg-black/40 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gold/20 rounded-3xl flex items-center justify-center text-gold border border-gold/30">
                <Crown size={40} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-1">Your Standing</span>
                <span className="text-3xl font-black uppercase italic">
                  {myEntry ? `Ranked #${myEntry.rank}` : "Unranked"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-12">
               <div className="text-center md:text-right">
                 <div className="text-2xl font-black text-white">{myEntry?.points || 0}</div>
                 <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Total Points</div>
               </div>
               
               {pointsTo50 > 0 ? (
                 <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <ChevronUp size={20} className="text-red-500" />
                    <div>
                      <div className="text-sm font-black text-red-500">{pointsTo50} PTS</div>
                      <div className="text-[8px] text-red-500/60 font-black uppercase tracking-tighter">Gap to Top 50</div>
                    </div>
                 </div>
               ) : myEntry && myEntry.rank <= 50 ? (
                 <div className="bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <Trophy size={20} className="text-green-500" />
                    <div>
                      <div className="text-sm font-black text-green-500">QUALIFIED</div>
                      <div className="text-[8px] text-green-500/60 font-black uppercase tracking-tighter">Top 50 Status</div>
                    </div>
                 </div>
               ) : (
                 <Link href="/lobby" className="bg-gold text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
                   Play Now
                 </Link>
               )}
            </div>
          </motion.div>
        )}

        {/* ═══ LEADERBOARD TABLE ═══ */}
        <div className="bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Rank</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Competitor</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Played</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Won</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rankings.map((entry, idx) => {
                const isMe = entry.username === user?.email?.split('@')[0];
                const isTop50 = entry.rank <= 50;

                return (
                  <tr 
                    key={idx} 
                    className={`group transition-all ${
                      isMe ? 'bg-gold/20' : isTop50 ? 'hover:bg-gold/5' : 'hover:bg-white/5'
                    }`}
                    style={isTop50 ? { borderLeft: '4px solid #c9a44c' } : {}}
                  >
                    <td className="p-6">
                       <div className="flex items-center gap-3">
                          <span className={`text-xl font-black italic ${entry.rank <= 3 ? 'text-gold' : 'text-white/60'}`}>
                            #{entry.rank}
                          </span>
                          {entry.rank === 1 && <Crown size={16} className="text-gold animate-bounce" />}
                       </div>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border ${isMe ? 'border-gold' : 'border-white/10'}`}>
                            <User size={20} className={isMe ? 'text-gold' : 'text-white/40'} />
                          </div>
                          <div className="flex flex-col">
                             <span className={`text-sm font-black uppercase tracking-widest ${isMe ? 'text-gold' : 'text-white'}`}>
                                {entry.username}
                             </span>
                             {isMe && <span className="text-[8px] text-gold font-black uppercase">Your Identity</span>}
                          </div>
                       </div>
                    </td>
                    <td className="p-6 text-center text-sm font-bold text-white/40">{entry.tournaments_played}</td>
                    <td className="p-6 text-center text-sm font-bold text-white/40">{entry.tournaments_won}</td>
                    <td className="p-6 text-right">
                       <span className={`text-xl font-black ${isTop50 ? 'text-gold' : 'text-white'}`}>
                         {entry.points.toLocaleString()}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rankings.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
               <Trophy size={48} />
               <p className="font-black uppercase tracking-widest text-xs">The leaderboard is currently empty.</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-10">
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gold shadow-[0_0_10px_rgba(201,164,76,1)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">In Championship Zone (Top 50)</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Competitive Field</span>
           </div>
        </div>

      </main>

      {/* ═══ FOOTER NAV ═══ */}
      <footer className="fixed bottom-0 left-0 w-full p-8 flex justify-center pointer-events-none z-20">
         <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-3xl flex items-center gap-10 pointer-events-auto shadow-2xl">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-gold transition-colors">Home</Link>
            <Link href="/lobby" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-gold transition-colors">Lobby</Link>
            <Link href="/profile" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-gold transition-colors">My Profile</Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
               <Info size={14} className="text-gold" />
               <span className="text-[10px] font-black uppercase tracking-widest text-gold italic">Season Ends Dec 31</span>
            </div>
         </div>
      </footer>

    </div>
  );
}
