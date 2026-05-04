import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '@/lib/tournament/useTournament';
import { ChevronUp, ChevronDown, User, Skull, Trophy } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

const RankMovement = memo(({ direction }: { direction: 'up' | 'down' }) => (
  <motion.div
    initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.5 }}
    className="flex items-center"
  >
    {direction === 'up' ? (
      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
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
    <div className="relative z-40 w-full h-full flex flex-col">
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-white/[0.06] backdrop-blur-xl"
        style={{
          background: 'rgba(10, 12, 16, 0.97)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-amber-400" />
            <span
              className="text-[15px] font-semibold uppercase tracking-[0.2em] text-white/40"
              style={{ fontFamily: FONTS.primary }}
            >
              Leaderboard
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/30 font-medium uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar divide-y divide-white/[0.04] pb-8">
          <AnimatePresence>
            {scores.map((s, idx) => {
              const pid = s.player_id.toString();
              const m = movement[pid];
              const isMe = !s.is_bot;
              const isEliminated = s.status === "eliminated";
              const isFirst = s.rank === 1 && !isEliminated;
              const isDanger = !isEliminated && s.rank >= Math.max(3, scores.filter(p => p.status === 'active').length - 1);
              const isBetting = s.currentWager > 0 && phase === 'betting';

              // Rank badge color
              const rankColors: Record<number, string> = {
                1: '#F59E0B',
                2: '#94A3B8',
                3: '#CD7C2F',
              };
              const rankColor = rankColors[s.rank] ?? s.color ?? '#4B5563';

              return (
                <motion.div
                  key={pid}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: isEliminated ? 0.3 : 1,
                    backgroundColor:
                      m === 'up'
                        ? 'rgba(16, 185, 129, 0.06)'
                        : m === 'down'
                          ? 'rgba(239, 68, 68, 0.06)'
                          : isBetting
                            ? 'rgba(245, 158, 11, 0.04)'
                            : isMe
                              ? 'rgba(245, 158, 11, 0.05)'
                              : 'rgba(0,0,0,0)',
                  }}
                  transition={{
                    layout: { type: 'spring', stiffness: 400, damping: 38 },
                    backgroundColor: { duration: 0.3 },
                  }}
                  className={`relative flex-1 flex items-center gap-3 px-5 py-5 min-h-[55px] transition-colors ${isEliminated ? 'grayscale' : ''
                    } ${isMe ? '' : 'hover:bg-white/[0.02]'}`}
                >
                  {/* Left accent bar for current user */}
                  {isMe && !isEliminated && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r-full bg-amber-400" />
                  )}

                  {/* Rank */}
                  <div
                    className="w-7 flex-shrink-0 flex items-center justify-center"
                  >
                    {isEliminated ? (
                      <Skull className="w-3.5 h-3.5 text-white/20" />
                    ) : (
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{
                          color: rankColors[s.rank] ?? 'rgba(255,255,255,0.35)',
                          fontFamily: FONTS.primary,
                        }}
                      >
                        {s.rank}
                      </span>
                    )}
                  </div>

                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/10"
                    style={{ backgroundColor: rankColor }}
                  />

                  {/* Name + meta */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-[13px] font-semibold truncate leading-tight ${isEliminated
                        ? 'text-white/25'
                        : isMe
                          ? 'text-amber-300'
                          : 'text-white/85'
                        }`}
                    >
                      {s.username}
                    </span>

                    <div className="flex items-center gap-2 mt-0.5">
                      {isEliminated ? (
                        <span className="text-[10px] text-white/20 font-medium">
                          Eliminated · #{s.final_position}
                        </span>
                      ) : isBetting && s.currentWager > 0 ? (
                        <span className="text-[10px] text-amber-400/70 font-medium">
                          At risk: ${s.currentWager.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Movement + Chips */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <AnimatePresence>
                      {m && !isEliminated && (
                        <motion.div
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                        >
                          <RankMovement direction={m} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.span
                      key={s.chips}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 0.25 }}
                      className={`text-[14px] font-bold tabular-nums ${isEliminated
                        ? 'text-white/15'
                        : isMe
                          ? 'text-white'
                          : 'text-white/70'
                        }`}
                      style={{ fontFamily: FONTS.primary }}
                    >
                      ${s.chips.toLocaleString()}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom shimmer bar */}
        <div className="relative h-px bg-white/[0.04] overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </div>
  );
}