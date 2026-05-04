'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeVideoModal({ isOpen, onClose }: WelcomeVideoModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeVideo', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.06]"
          style={{
            background: 'rgba(10, 12, 16, 0.98)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Welcome
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/20 hover:text-white/50 transition-colors text-[11px] font-medium uppercase tracking-wider"
            >
              Skip
            </button>
          </div>

          {/* Title block */}
          <div className="px-6 pt-6 pb-5 border-b border-white/[0.05]">
            <h2 className="text-[22px] font-bold text-white/90 leading-snug mb-1">
              Welcome to the Arena
            </h2>
            <p className="text-[13px] text-white/35 leading-relaxed max-w-md">
              Watch this brief introduction to understand the rules before your first round.
            </p>
          </div>

          {/* Video */}
          <div className="relative w-full aspect-video bg-black border-b border-white/[0.05]">
            <div className="absolute inset-0 flex items-center justify-center text-white/5 text-[11px] uppercase tracking-widest font-semibold select-none pointer-events-none">
              Tournament Intro
            </div>
            <video
              autoPlay
              controls
              className="w-full h-full object-cover relative z-10"
              poster="https://images.unsplash.com/photo-1596838132731-dd3645c19451?q=80&w=2070&auto=format&fit=crop"
            >
              <source src="https://media.w3.org/2010/05/sintel/trailer.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className="relative w-4 h-4 rounded flex-shrink-0 border transition-colors"
                style={{
                  borderColor: dontShowAgain ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                  backgroundColor: dontShowAgain ? 'rgba(245,158,11,0.15)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  checked={dontShowAgain}
                  onChange={e => setDontShowAgain(e.target.checked)}
                />
                {dontShowAgain && (
                  <motion.svg
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 w-full h-full p-[2px]"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <polyline
                      points="2,6 5,9 10,3"
                      stroke="#f59e0b"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </div>
              <span className="text-[11px] text-white/30 group-hover:text-white/50 transition-colors font-medium uppercase tracking-wider">
                Don't show again
              </span>
            </label>

            {/* CTA Button */}
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-[12px] font-semibold uppercase tracking-[0.15em] transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#f59e0b',
              }}
            >
              Enter Arena
            </button>
          </div>

          {/* Bottom shimmer */}
          <div className="relative h-px bg-white/[0.04] overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}