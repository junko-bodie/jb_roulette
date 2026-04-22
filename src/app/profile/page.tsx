'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Medal, Star, Target, PlayCircle, History, Shield, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoading: sessionLoading } = useGame();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/players/${user.id}/profile`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050d0a] flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050d0a] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-black uppercase mb-4 text-gold">Profile Not Found</h1>
        <Link href="/" className="px-6 py-3 bg-white/10 rounded-xl hover:bg-gold hover:text-black transition-all">Go Home</Link>
      </div>
    );
  }

  const badgesCount = Object.values(profile.badges || {}).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#050d0a] text-white overflow-hidden pb-24" style={{ background: `radial-gradient(circle at 10% 20%, #165b45 0%, #050d0a 100%)` }}>
      
      {/* ═══ CHAMPIONSHIP BANNER ═══ */}
      {profile.annual_championship_qualified && (
        <div className="bg-gold text-black py-3 text-center font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(201,164,76,0.4)] relative z-20">
          🏆 You have qualified for the Junko Bodie Annual Championship 🏆
        </div>
      )}

      {/* ═══ TOP NAVBAR ═══ */}
      <nav className="p-8 flex items-center justify-between z-10 relative">
        <Link href="/" className="group flex items-center gap-2">
           <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(201,164,76,0.5)] transition-transform group-hover:rotate-12">
             <Trophy size={20} />
           </div>
           <span className="font-black tracking-widest text-lg uppercase italic">Roulette <span className="text-gold">PRO</span></span>
        </Link>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Star className="text-gold w-4 h-4 fill-gold" />
              <span className="text-xs font-black tracking-widest text-gold">{profile.season?.points || 0} SEASON XP</span>
           </div>
           <Link href="/lobby" className="px-6 py-3 bg-gold text-black font-black uppercase tracking-widest rounded-xl text-xs hover:scale-105 active:scale-95 transition-all shadow-lg">
             Enter Lobby
           </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-8 relative">
        
        {/* Floating background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[120px] -z-10" />

        {/* ═══ HEADER SECTION ═══ */}
        <header className="flex flex-col md:flex-row items-center gap-10 mb-16">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="w-40 h-40 rounded-[2.5rem] border-4 border-gold p-1 shadow-[0_0_40px_rgba(201,164,76,0.3)]">
              <img src={profile.avatar_url || '/avatars/default.png'} alt={profile.username} className="w-full h-full object-cover rounded-[2.2rem]" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#0a0a0a] border-2 border-gold rounded-2xl px-4 py-2 flex items-center gap-2">
               <Shield size={16} className="text-gold" />
               <span className="text-[10px] font-black uppercase italic tracking-widest">Level {Math.floor((profile.season?.points || 0) / 500) + 1}</span>
            </div>
          </motion.div>

          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">{profile.name || profile.username}</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-xs flex items-center justify-center md:justify-start gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Global Player ID: {profile._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </header>

        {/* ═══ STATS GRID ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <StatCard icon={<PlayCircle className="text-white/40" />} label="Tournaments" value={profile.stats?.tournaments_played || 0} sub="Played" />
          <StatCard icon={<Trophy className="text-gold" />} label="Victories" value={profile.stats?.tournaments_won || 0} sub="1st Place" highlight />
          <StatCard icon={<Target className="text-blue-400" />} label="Best Finish" value={profile.stats?.best_finish === 7 ? 'N/A' : `#${profile.stats?.best_finish}`} sub="Peak Rank" />
          <StatCard icon={<Medal className="text-green-400" />} label="Season Rank" value={`#${profile.season?.rank || '—'}`} sub="Global" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* ═══ LEFT: BADGES & SEASON ═══ */}
          <div className="lg:col-span-1 space-y-10">
            
            {/* Badges */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Achievements ({badgesCount})</h3>
                <Award size={16} className="text-gold" />
              </div>
              <div className="bg-black/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl grid grid-cols-2 gap-4">
                 <BadgeItem 
                   active={profile.badges?.champion} 
                   icon={<Trophy size={20} />} 
                   label="Champion" 
                   desc="Win 1 Tournament"
                 />
                 <BadgeItem 
                   active={profile.badges?.elite_status} 
                   icon={<Star size={20} />} 
                   label="Elite Status" 
                   desc="Reach 500 XP"
                 />
                 <BadgeItem 
                   active={profile.badges?.all_time_champion} 
                   icon={<Medal size={20} />} 
                   label="Grandmaster" 
                   desc="Coming Soon"
                 />
                 <div className="aspect-square bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-4">
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-widest text-center italic">Secret Reward</span>
                 </div>
              </div>
            </section>

            {/* Season Progress */}
            <section>
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6">Season 2026 Summary</h3>
              <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-3xl p-8 backdrop-blur-xl">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="text-3xl font-black text-white">{profile.season?.points || 0} <span className="text-sm font-bold text-white/40 tracking-widest uppercase">Points</span></div>
                      <div className="text-[10px] text-gold font-black uppercase tracking-widest mt-1 italic">Provisional Rank: #{profile.season?.rank || 999}</div>
                    </div>
                 </div>
                 <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((profile.season?.points || 0) % 500) / 5)}%` }}
                      className="h-full bg-gold shadow-[0_0_10px_rgba(201,164,76,0.5)]"
                    />
                 </div>
                 <div className="flex justify-between mt-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Next Prestige</span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{(Math.floor((profile.season?.points || 0) / 500) + 1) * 500} XP</span>
                 </div>
              </div>
            </section>
          </div>

          {/* ═══ RIGHT: RECENT HISTORY ═══ */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Recent Tournaments</h3>
              <History size={16} className="text-white/40" />
            </div>
            <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl space-y-4">
               {profile.history?.length > 0 ? profile.history.map((t: any) => (
                 <div key={t.id} className="group flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer">
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${
                         t.position === 1 ? 'bg-gold text-black' : 
                         t.position === 2 ? 'bg-silver text-black' : 'bg-white/5 text-white/60'
                       }`}>
                         {t.position}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black uppercase tracking-widest italic group-hover:text-gold transition-colors">
                            Tournament {t.id.slice(-4).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                            {new Date(t.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 pr-4">
                       <div className="text-right">
                          <div className="font-black text-lg">${t.chips.toLocaleString()}</div>
                          <div className="text-[9px] text-white/20 uppercase tracking-tighter">Final Balance</div>
                       </div>
                       <ChevronRight className="text-white/10 group-hover:text-gold transition-all group-hover:translate-x-1" />
                    </div>
                 </div>
               )) : (
                 <div className="py-20 text-center flex flex-col items-center gap-4">
                    <History size={40} className="text-white/5" />
                    <p className="text-white/20 font-black uppercase tracking-widest text-xs">No Recent Activity Found</p>
                    <Link href="/lobby" className="text-gold text-[10px] font-black uppercase tracking-widest border-b border-gold/20 pb-1 hover:border-gold transition-all">Start First Tournament</Link>
                 </div>
               )}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}

function StatCard({ icon, label, value, sub, highlight }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-black/40 border ${highlight ? 'border-gold/30 ring-1 ring-gold/10' : 'border-white/5'} rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden`}
    >
      {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-gold/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />}
      <div className="flex flex-col items-center gap-1 text-center relative z-10">
        <div className="mb-4">{icon}</div>
        <div className={`text-4xl font-black ${highlight ? 'text-gold drop-shadow-[0_0_15px_rgba(201,164,76,0.2)]' : 'text-white'}`}>{value}</div>
        <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</div>
        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">{sub}</div>
      </div>
    </motion.div>
  );
}

function BadgeItem({ active, icon, label, desc }: any) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
      active ? 'bg-gold/10 border-gold/40 shadow-inner ring-1 ring-gold/10' : 'bg-white/[0.02] border-white/5 opacity-30 grayscale'
    }`}>
      <div className={`mb-2 ${active ? 'text-gold' : 'text-white'}`}>{icon}</div>
      <span className={`text-[9px] font-black uppercase tracking-widest text-center ${active ? 'text-white' : 'text-white/40'}`}>{label}</span>
      <span className="text-[7px] text-white/20 font-bold uppercase tracking-tighter text-center mt-1">{active ? 'Unlocked' : desc}</span>
    </div>
  );
}
