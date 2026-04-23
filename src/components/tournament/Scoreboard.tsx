'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '@/lib/tournament/useTournament';
import { ChevronUp, ChevronDown, User, Bot, Skull } from 'lucide-react';

export default function Scoreboard() {
  const { scores, currentSpin, currentRound, phase, totalSpins } = useTournament();
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
  const [movement, setMovement] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    if (scores.length === 0) return;

    const newMovement: Record<string, 'up' | 'down' | null> = {};
    let changed = false;

    // Only track movement for active players
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
      const timer = setTimeout(() => setMovement({}), 2000);
      
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

  const spinsRemaining = totalSpins - (currentSpin - 1);

  return (
    <div className="sticky top-4 self-start z-40 w-80">
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-[#0a0a0a]/90 border border-gold/30 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden relative"
      >
        {/* Animated accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10 px-4 mt-2">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] leading-none mb-1.5">Round {currentRound}/5</h2>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Live Ranking</h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5 leading-none">Spin</span>
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
              <span className="text-xs font-black text-white tabular-nums leading-none">{currentSpin}/5</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <AnimatePresence mode="popLayout">
            {scores.map((s) => {
              const pid = s.player_id.toString();
              const m = movement[pid];
              const isMe = !s.is_bot;
              const isEliminated = s.status === "eliminated";

              return (
                <motion.div
                  key={pid}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: isEliminated ? 0.4 : 1, 
                    x: 0,
                    scale: isMe ? 1.02 : 1
                  }}
                  className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-500 ${
                    isMe 
                      ? 'bg-gradient-to-r from-gold/20 to-gold/5 border-gold/40 shadow-[0_0_25px_rgba(201,164,76,0.15)] ring-1 ring-gold/20' 
                      : isEliminated
                      ? 'bg-black/40 border-white/5 saturate-0'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                      isMe ? 'bg-gold text-black shadow-[0_0_15px_rgba(201,164,76,0.4)]' : 
                      isEliminated ? 'bg-white/10 text-white/40' : 'bg-white/5 text-white/60'
                    }`}>
                      {isEliminated ? (
                        <Skull className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-black tabular-nums leading-none">
                          {s.rank}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-bold truncate ${isMe ? 'text-white' : 'text-white/90'}`}>
                          {s.username}
                        </span>
                        {isMe && <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {s.is_bot ? <Bot className="w-2.5 h-2.5 text-white/30" /> : <User className="w-2.5 h-2.5 text-gold/60" />}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-gold/60' : 'text-white/40'}`}>
                          {isEliminated ? `POS #${s.final_position}` : isMe ? 'PRO PLAYER' : 'ELITE BOT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-2">
                    <AnimatePresence>
                      {m && !isEliminated && (
                        <motion.div
                          initial={{ opacity: 0, y: m === 'up' ? 5 : -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="flex items-center"
                        >
                          {m === 'up' ? (
                            <ChevronUp className="w-4 h-4 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="text-right">
                      <span className={`text-[15px] font-black tabular-nums transition-colors ${
                        isEliminated ? 'text-white/30' : isMe ? 'text-gold' : 'text-white'
                      }`}>
                        ${s.chips.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Dynamic tracking status */}
        <div className="mt-8 pt-5 border-t border-white/5">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-40" />
                </div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.1em]">Ranking Active</span>
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">v1.2.0</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
