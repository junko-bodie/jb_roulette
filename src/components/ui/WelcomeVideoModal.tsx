'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeVideoModal({ isOpen, onClose }: WelcomeVideoModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeVideo', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(3, 5, 8, 0.94)', backdropFilter: 'blur(24px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-[720px] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0f1117 0%, #090c12 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle top glow line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(201,164,76,0.5), transparent)',
            }}
          />

          {/* Header */}
          <div
            className="flex items-center justify-between px-8 pt-7 pb-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  background: 'rgba(201,164,76,0.1)',
                  border: '1px solid rgba(201,164,76,0.2)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a44c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" fill="rgba(201,164,76,0.4)" />
                </svg>
              </div>
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: 'rgba(201,164,76,0.7)' }}
                >
                  Briefing Room
                </p>
                <h2 className="text-[17px] font-bold tracking-tight" style={{ color: 'white' }}>
                  The Arena Awaits
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
              }}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Subtitle */}
          <div className="px-8 pt-5 pb-5">
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {isVideoEnded 
                ? "The briefing is complete. You are ready to take your place among the elite."
                : "Listen carefully to the master of ceremonies. Your strategy begins now."}
            </p>
          </div>

          {/* Video Container */}
          <div
            className="mx-8 overflow-hidden relative group"
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#000',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            <div className="relative w-full aspect-video">
              {/* Fade Overlay for End of Video */}
              <motion.div 
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isVideoEnded ? 0.7 : 0 }}
                style={{ background: 'black' }}
              />

              <video
                ref={videoRef}
                autoPlay
                className="w-full h-full object-cover relative z-10 transition-opacity duration-700"
                style={{ opacity: isVideoEnded ? 0.3 : 1 }}
                onEnded={() => setIsVideoEnded(true)}
              >
                <source src="https://media.w3.org/2010/05/sintel/trailer.mp4" type="video/mp4" />
              </video>

              {/* Big Centered CTA Button */}
              <AnimatePresence>
                {isVideoEnded && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-[#c9a44c] text-[11px] font-black uppercase tracking-[0.4em]"
                    >
                      Are You Ready To Be Tested?
                    </motion.div>
                    <button
                      onClick={handleClose}
                      className="group relative px-10 py-5 rounded-full overflow-hidden transition-all active:scale-95"
                      style={{ 
                        background: '#c9a44c',
                        boxShadow: '0 0 50px rgba(201,164,76,0.4)'
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative text-[#0a0a0a] text-sm font-black uppercase tracking-[0.2em]">
                        Enter Tournament
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 px-8 pt-6 pb-8">
            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className="relative flex items-center justify-center w-5 h-5 rounded-lg flex-shrink-0 transition-all"
                style={{
                  border: `1.5px solid ${dontShowAgain ? '#c9a44c' : 'rgba(255,255,255,0.1)'}`,
                  background: dontShowAgain ? 'rgba(201,164,76,0.1)' : 'rgba(255,255,255,0.04)',
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
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    width="12"
                    height="12"
                    viewBox="0 0 10 10"
                    fill="none"
                  >
                    <polyline
                      points="1.5,5 4,7.5 8.5,2"
                      stroke="#c9a44c"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </div>
              <span
                className="text-[12px] font-semibold transition-colors select-none"
                style={{ color: dontShowAgain ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}
              >
                Don't show again
              </span>
            </label>

            {/* Footer CTA Button */}
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.15em] transition-all"
              style={{
                background: isVideoEnded ? '#c9a44c' : 'rgba(201,164,76,0.1)',
                border: '1px solid rgba(201,164,76,0.25)',
                color: isVideoEnded ? '#0a0a0a' : '#c9a44c',
                boxShadow: isVideoEnded ? '0 10px 30px rgba(201,164,76,0.3)' : 'none'
              }}
            >
              {isVideoEnded ? 'Enter Arena' : 'Skip Briefing'}
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}