'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

interface WinnerScreenProps {
  tournament: any;
  player: {
    username: string;
    is_bot: boolean;
    final_chips: number;
    final_position: number;
    eliminated_round: number;
  };
}

export default function WinnerScreen({ tournament, player }: WinnerScreenProps) {
  const isWinner = player.final_position === 1;

  useEffect(() => {
    if (isWinner) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isWinner]);

  const standings = useMemo(() => {
    return [...tournament.players].sort((a, b) => {
      const posA = a.final_position || (a.status === 'active' ? 1 : 6);
      const posB = b.final_position || (b.status === 'active' ? 1 : 6);
      return posA - posB;
    });
  }, [tournament]);

  const pointsEarned = useMemo(() => {
    const p = tournament.players.find((p: any) => p.username === player.username);
    return p?.points_earned ?? 0;
  }, [tournament, player]);

  const realPlayer = tournament.players.find((p: any) => !p.is_bot);
  const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#cd7c2f' };

  return (
    <div
      className="fixed inset-0 z-[250] overflow-y-auto flex items-center justify-center"
      style={{ 
        background: `radial-gradient(circle at 50% 30%, #0a251a 0%, #050a08 100%)`
      }}
    >
      <div className="w-full max-w-xl mx-auto flex flex-col px-6 py-12 gap-5">

        {/* ── Page title ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-2 pb-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/25">
            Tournament Complete
          </span>
          <h1
            className="text-[32px] font-black text-white/90 tracking-tight leading-none"
            style={{ fontFamily: FONTS.primary }}
          >
            Final Standings
          </h1>
          <div className="h-px w-16 bg-amber-400/30 mt-1" />
        </motion.div>

        {/* ── Stats card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
          style={{
            background: 'rgba(10, 12, 16, 0.98)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Your Result
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
            {[
              { label: 'Position', value: `#${player.final_position}`, color: rankColors[player.final_position] ?? 'rgba(255,255,255,0.8)' },
              { label: 'Final Chips', value: `$${player.final_chips.toLocaleString()}`, color: '#f59e0b' },
              { label: 'Season Points', value: `+${pointsEarned}`, color: '#10b981' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex flex-col items-center justify-center py-8 gap-2"
              >
                <span className="text-[10px] text-white/25 font-medium uppercase tracking-[0.15em]">
                  {stat.label}
                </span>
                <span
                  className="text-[28px] font-black tabular-nums leading-none"
                  style={{ color: stat.color, fontFamily: FONTS.primary }}
                >
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="relative h-px bg-white/[0.04] overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* ── Standings card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
          style={{
            background: 'rgba(10, 12, 16, 0.98)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Rankings
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">
                {standings.length} players
              </span>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.04]">
            {standings.map((s, idx) => {
              const isMe = s.username === realPlayer?.username;
              const chips = s.final_chips || s.current_chips || 0;
              const rank = idx + 1;
              const rankColor = rankColors[rank] ?? 'rgba(255,255,255,0.3)';

              return (
                <motion.div
                  key={s.player_id?.toString() ?? idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.06 }}
                  className="relative flex items-center gap-4 px-6 py-5"
                  style={{ backgroundColor: isMe ? 'rgba(245,158,11,0.05)' : undefined }}
                >
                  {isMe && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-r-full bg-amber-400" />
                  )}

                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    <span
                      className="text-[15px] font-bold tabular-nums"
                      style={{ color: rankColor, fontFamily: FONTS.primary }}
                    >
                      {rank}
                    </span>
                  </div>

                  {/* Dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10"
                    style={{ backgroundColor: rankColor }}
                  />

                  {/* Name */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[15px] font-semibold truncate"
                        style={{ color: isMe ? '#f59e0b' : 'rgba(255,255,255,0.85)' }}
                      >
                        {s.username}
                      </span>
                      {isMe && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </div>
                    <span className="text-[11px] text-white/25 font-medium uppercase tracking-wider mt-0.5">
                      {isMe ? 'You' : 'Opponent'}
                    </span>
                  </div>

                  {/* Chips */}
                  <span
                    className="text-[16px] font-bold tabular-nums flex-shrink-0"
                    style={{
                      color: isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                      fontFamily: FONTS.primary,
                    }}
                  >
                    ${chips.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="relative h-px bg-white/[0.04] overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="flex justify-center pt-2"
        >
          <Link
            href="/lobby"
            className="flex items-center gap-3 px-10 py-4 rounded-xl text-[13px] font-semibold uppercase tracking-[0.15em] transition-all hover:opacity-90 active:scale-95 group"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#f59e0b',
            }}
          >
            Return to Lobby
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}