'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentContext } from '@/lib/tournament/TournamentContext';
import { FONTS } from '@/styles/theme';

export default function LiveBettingFeed() {
  const { events, phase } = useTournamentContext();

  if (phase !== 'betting' && events.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full h-full overflow-hidden pointer-events-none px-2">
      <div className="flex flex-col-reverse justify-start h-full gap-2.5 overflow-y-auto no-scrollbar pb-10">
        <AnimatePresence initial={false}>
          {events.slice(0, 8).map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group p-4 rounded-xl border border-white/5 bg-black/60 shadow-lg overflow-hidden min-h-[50px] flex items-center"
              style={{
                borderLeft: `4px solid ${event.color || '#c9a44c'}`,
              }}
            >
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex flex-wrap items-baseline gap-1.5 flex-1 min-w-0">
                  <span 
                    className="text-[14px] font-bold truncate text-white/90 max-w-[120px]"
                    style={{ color: event.color || '#fff' }}
                  >
                    {event.username}
                  </span>
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest shrink-0">
                    placed
                  </span>
                  <span className="text-[12px] text-white/60 font-bold shrink-0">
                    {event.betZone ? `on ${event.betZone.replace('num-', '').toUpperCase()}` : 'a bet'}
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span 
                    className="text-[17px] font-black tabular-nums text-white/80" 
                    style={{ fontFamily: FONTS.primary }}
                  >
                    ${event.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Subtle accent glow */}
              <div 
                className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none"
                style={{ backgroundColor: event.color }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
