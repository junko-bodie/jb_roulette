'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, Crown, ArrowLeft, Users, Zap, TrendingUp, Star } from 'lucide-react';
import { useGame } from '@/context/GameContext';

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
    // Very fast update tick as requested (every 2 seconds)
    const interval = setInterval(fetchLeaderboard, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050a08] text-white p-4 md:p-8 font-sans selection:bg-[#c9a44c]/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c9a44c]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/lobby')}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-[#c9a44c]" />
            </button>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 italic" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                World <span className="text-[#c9a44c]">Rankings</span>
              </h1>
              <div className="flex items-center gap-2 opacity-40">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Global Player Database</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[120px]">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
              </div>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex flex-col items-center min-w-[120px]">
              <span className="text-[10px] font-bold text-[#c9a44c]/60 uppercase tracking-widest mb-1">Next Reset</span>
              <span className="text-xs font-black text-white uppercase tracking-widest">24:00:00</span>
            </div>
          </div>
        </div>

        {/* Podium / Top 3 */}
        {!isLoading && entries.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[entries[1], entries[0], entries[2]].map((player, idx) => {
              const displayIdx = [2, 1, 3][idx];
              const isFirst = displayIdx === 1;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: displayIdx * 0.1 }}
                  className={`relative p-8 rounded-[3rem] border flex flex-col items-center ${
                    isFirst 
                      ? 'bg-gradient-to-b from-[#c9a44c]/20 to-transparent border-[#c9a44c]/50 scale-110 z-20 shadow-[0_30px_100px_rgba(201,164,76,0.15)]' 
                      : 'bg-white/5 border-white/10 mt-6'
                  }`}
                >
                  {isFirst && <Crown className="w-10 h-10 text-[#c9a44c] absolute -top-5" />}
                  <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-6 relative overflow-hidden ${
                    isFirst ? 'border-[#c9a44c]' : 'border-white/20'
                  }`}>
                    <img src={player.avatar || '/avatars/default.png'} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl font-black text-center mb-1">{player.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-[#c9a44c] uppercase tracking-[0.2em]">Rank #{displayIdx}</span>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{player.tournaments_won} Wins</span>
                  </div>
                  <div className="text-3xl font-black tabular-nums" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                    ${player.balance.toLocaleString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Table List */}
        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl">
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-[#c9a44c]" />
              <span className="text-sm font-black uppercase tracking-widest text-white/60">Elite Contenders</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest hidden md:block">Win Rate</span>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Total Wealth</span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {entries.slice(3).map((player, idx) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex items-center justify-between p-4 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-6">
                    <span className="w-8 text-xl font-black text-white/20 italic tabular-nums">
                      {player.rank}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 overflow-hidden">
                        <img src={player.avatar || '/avatars/default.png'} alt={player.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white/90 group-hover:text-white transition-colors">
                            {player.name}
                          </span>
                          {player.is_pro && (
                            <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                          )}
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                          Tier: {player.balance > 100000 ? 'Diamond' : player.balance > 10000 ? 'Platinum' : 'Silver'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="hidden md:flex flex-col items-end">
                       <span className="text-xs font-bold text-emerald-500/60">+{(Math.random() * 5).toFixed(1)}%</span>
                       <TrendingUp className="w-3 h-3 text-emerald-500/30 mt-1" />
                    </div>
                    <div className="text-right min-w-[120px]">
                      <span className="text-lg font-black tabular-nums text-white" style={{ fontFamily: "'Bodoni Moda', serif" }}>
                        ${player.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* User's Current Rank Card */}
        {userProfile && !entries.some(e => e.name === userProfile.name) && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-12 p-6 rounded-3xl bg-[#c9a44c] text-black flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center font-black text-xl">
                ?
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest opacity-60">Your Position</span>
                <h3 className="text-xl font-black uppercase tracking-tighter">Ineligible (Guest or Unranked)</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Chips Required</span>
              <div className="text-2xl font-black">$5,000</div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-24 text-center pb-12">
        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">Junko Bodie Global Protocol</span>
      </div>
    </div>
  );
}
