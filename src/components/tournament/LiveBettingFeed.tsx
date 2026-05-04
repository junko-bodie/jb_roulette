'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentContext } from '@/lib/tournament/TournamentContext';
import { FONTS } from '@/styles/theme';

export default function LiveBettingFeed() {
  const { events, phase } = useTournamentContext();

  if (phase !== 'betting' && events.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] backdrop-blur-xl w-full h-full flex flex-col"
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
            Live Feed
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 flex flex-col divide-y divide-white/[0.04] overflow-y-auto no-scrollbar pb-8">
        <AnimatePresence initial={false}>
          {events.slice(0, 15).map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex-1 flex items-center gap-3 px-5 py-5 min-h-[55px]"
            >
              {/* Player color dot */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/10"
                style={{ backgroundColor: event.color || '#c9a44c' }}
              />

              {/* Text */}
              <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
                <span
                  className="text-[13px] font-semibold truncate"
                  style={{ color: event.color || 'rgba(255,255,255,0.85)' }}
                >
                  {event.username}
                </span>
                <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider shrink-0">
                  placed
                </span>
                <span className="text-[11px] text-white/40 font-medium shrink-0">
                  {event.betZone
                    ? `on ${event.betZone.replace('num-', '').toUpperCase()}`
                    : 'a bet'}
                </span>
              </div>

              {/* Amount */}
              <span
                className="text-[14px] font-bold tabular-nums text-white/80 flex-shrink-0"
                style={{ fontFamily: FONTS.primary }}
              >
                ${event.amount.toLocaleString()}
              </span>
            </motion.div>
          ))}
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
    </div>
  );
}