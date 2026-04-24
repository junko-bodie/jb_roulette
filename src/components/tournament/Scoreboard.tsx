import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '@/lib/tournament/useTournament';
import { ChevronUp, ChevronDown, User, Bot, Skull, Trophy } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

const RankMovement = memo(({ direction }: { direction: 'up' | 'down' }) => (
  <motion.div
    initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.5 }}
    className="flex items-center"
  >
    {direction === 'up' ? (
      <ChevronUp className="w-4 h-4 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
    )}
  </motion.div>
));

RankMovement.displayName = 'RankMovement';

export default function Scoreboard() {
  const { scores, currentSpin, currentRound, phase, totalSpins } = useTournament();
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
  const [movement, setMovement] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    if (scores.length === 0) return;

    const newMovement: Record<string, 'up' | 'down' | null> = {};
    let changed = false;

    scores.forEach(s => {
      if (s.status !== "active") return;
      
      const pid = s.player_id.toString();
      const prevRank = prevRanks[pid];
      if (prevRank !== undefined) {
        if (s.rank < prevRank) {
          newMovement[pid] = 'up';
          changed = true;
        } else if (s.rank > prevRank) {
          newMovement[pid] = 'down';
          changed = true;
        }
      }
    });

    if (changed) {
      setMovement(newMovement);
      const timer = setTimeout(() => setMovement({}), 3000);
      
      const newRanks: Record<string, number> = {};
      scores.forEach(s => {
        if (s.status === "active") newRanks[s.player_id.toString()] = s.rank;
      });
      setPrevRanks(newRanks);
      
      return () => clearTimeout(timer);
    } else if (Object.keys(prevRanks).length === 0) {
      const newRanks: Record<string, number> = {};
      scores.forEach(s => {
        if (s.status === "active") newRanks[s.player_id.toString()] = s.rank;
      });
      setPrevRanks(newRanks);
    }
  }, [scores, prevRanks]);

  return (
    <div className="sticky top-4 self-start z-40 w-72 md:w-80">
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-[#c9a44c]/20 backdrop-blur-2xl shadow-[0_50px_100px_rgba(0,0,0,0.95)]"
        style={{
          background: 'linear-gradient(165deg, rgba(8, 18, 15, 0.99), rgba(2, 6, 4, 1))',
        }}
      >
        {/* Luxury Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#c9a44c]/5 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Header Section */}
        <div className="relative z-10 px-6 pt-10 pb-6 flex flex-col items-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] text-center w-full" style={{ fontFamily: FONTS.primary }}>
            Rankings
          </h2>
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#c9a44c]/60 to-transparent mt-4" />
        </div>

        {/* Players List */}
        <div className="relative z-10 px-4 pb-8 space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
          <AnimatePresence mode="popLayout">
            {scores.map((s, idx) => {
              const pid = s.player_id.toString();
              const m = movement[pid];
              const isMe = !s.is_bot;
              const isEliminated = s.status === "eliminated";
              const isFirst = s.rank === 1 && !isEliminated;

              return (
                <motion.div
                  key={pid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: isEliminated ? 0.35 : 1,
                    scale: isMe ? 1.02 : 1,
                    zIndex: isMe ? 20 : 10
                  }}
                  className={`group relative flex items-center justify-between p-4 rounded-3xl transition-all duration-500 ${
                    isMe 
                      ? 'bg-gradient-to-r from-[#c9a44c]/20 to-transparent border border-[#c9a44c]/40' 
                      : isEliminated
                      ? 'bg-white/[0.01] border border-white/5 grayscale'
                      : 'bg-white/[0.03] border border-white/5 hover:border-[#c9a44c]/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Circle */}
                    <div className={`w-9 h-9 flex-shrink-0 rounded-2xl flex items-center justify-center relative overflow-hidden ${
                      isFirst ? 'bg-gradient-to-br from-[#fef1a6] via-[#c9a44c] to-[#a07a2d] shadow-lg' :
                      isMe ? 'bg-white text-black' :
                      isEliminated ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white/60'
                    }`}>
                      {isEliminated ? (
                        <Skull className="w-4 h-4" />
                      ) : (
                        <span className={`text-base font-black tabular-nums ${isFirst ? 'text-black' : ''}`} style={{ fontFamily: FONTS.primary }}>
                          {s.rank}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[14px] font-bold truncate ${isMe ? 'text-[#c9a44c]' : 'text-white/90'}`}>
                        {s.username}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-30">
                        {s.is_bot ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          {isEliminated ? `POS #${s.final_position}` : isMe ? 'PRO' : 'BOT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-2">
                    <AnimatePresence>
                      {m && !isEliminated && <RankMovement direction={m} />}
                    </AnimatePresence>
                    <span className={`text-[17px] font-black tabular-nums ${
                      isEliminated ? 'text-white/20' : isMe ? 'text-white' : 'text-white/80'
                    }`} style={{ fontFamily: FONTS.primary }}>
                      ${s.chips.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Status Line */}
        <div className="relative h-1 bg-black/60 overflow-hidden">
           <motion.div 
             className="absolute inset-0 bg-[#c9a44c]/20"
             animate={{ x: ['-100%', '100%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
           />
        </div>
      </motion.div>
    </div>
  );
}



