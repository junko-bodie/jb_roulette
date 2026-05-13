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
          className="relative w-full max-w-[840px] overflow-visible"
          style={{
            background: '#0a0d12',
            borderRadius: '12px',
            border: '1px solid rgba(201, 164, 76, 0.2)',
            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
          }}
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.99 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative Corner Accents */}
          <div style={{ position: 'absolute', top: '-1px', left: '-1px', width: '30px', height: '30px', borderTop: '2px solid #c9a44c', borderLeft: '2px solid #c9a44c', borderTopLeftRadius: '12px' }} />
          <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '30px', height: '30px', borderTop: '2px solid #c9a44c', borderRight: '2px solid #c9a44c', borderTopRightRadius: '12px' }} />
          <div style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '30px', height: '30px', borderBottom: '2px solid #c9a44c', borderLeft: '2px solid #c9a44c', borderBottomLeftRadius: '12px' }} />
          <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '30px', height: '30px', borderBottom: '2px solid #c9a44c', borderRight: '2px solid #c9a44c', borderBottomRightRadius: '12px' }} />

          {/* Header */}
          <div
            className="flex items-center justify-between px-10 pt-8 pb-6"
          >
            <div className="flex items-center gap-5">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{
                  background: 'rgba(201,164,76,0.1)',
                  border: '1px solid rgba(201,164,76,0.3)',
                  boxShadow: 'inset 0 0 20px rgba(201,164,76,0.1)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a44c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" fill="rgba(201,164,76,0.4)" />
                </svg>
              </div>
              <div>
                <p
                  className="text-[11px] font-black uppercase tracking-[0.35em] mb-1"
                  style={{ color: '#c9a44c' }}
                >
                  Briefing Room
                </p>
                <h2 className="text-[22px] font-serif tracking-tight text-white leading-none">
                  The Arena Awaits
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:bg-white/10 text-white/40 hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Video Container */}
          <div
            className="mx-10 overflow-hidden relative"
            style={{
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#000',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
            }}
          >
            <div className="relative w-full aspect-video">
              <motion.div 
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isVideoEnded ? 0.8 : 0 }}
                style={{ background: '#05070a' }}
              />

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover relative z-10 transition-opacity duration-700"
                style={{ opacity: isVideoEnded ? 0.2 : 1 }}
                onEnded={() => setIsVideoEnded(true)}
              >
                <source src="/videos/export-2.mp4" type="video/mp4" />
              </video>

              <AnimatePresence>
                {isVideoEnded && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8"
                  >
                    <div className="text-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-[#c9a44c] text-[12px] font-black uppercase tracking-[0.5em] mb-4"
                      >
                        Briefing Complete
                      </motion.div>
                      <h3 className="text-white text-3xl font-serif italic mb-8">Ready to take your seat?</h3>
                    </div>
                    
                    <button
                      onClick={handleClose}
                      className="group relative px-12 py-5 rounded-sm overflow-hidden transition-all active:scale-95"
                      style={{ 
                        background: '#c9a44c',
                        boxShadow: '0 0 60px rgba(201,164,76,0.3)'
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      <span className="relative text-[#0a0a0a] text-[13px] font-black uppercase tracking-[0.3em]">
                        Enter Tournament
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Subtitle / Description */}
          <div className="px-10 py-6">
            <p className="text-[14px] leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {isVideoEnded 
                ? "The briefing is complete. You are ready to take your place among the elite."
                : "Listen carefully to the master of ceremonies. Your strategy begins now."}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-6 px-10 pt-4 pb-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <label className="flex items-center gap-4 cursor-pointer group">
              <div
                className="relative flex items-center justify-center w-6 h-6 rounded flex-shrink-0 transition-all"
                style={{
                  border: `1.5px solid ${dontShowAgain ? '#c9a44c' : 'rgba(255,255,255,0.2)'}`,
                  background: dontShowAgain ? 'rgba(201,164,76,0.2)' : 'transparent',
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
                    width="14"
                    height="14"
                    viewBox="0 0 10 10"
                    fill="none"
                  >
                    <polyline points="1.5,5 4,7.5 8.5,2" stroke="#c9a44c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </div>
              <span
                className="text-[13px] font-bold tracking-wide transition-colors select-none"
                style={{ color: dontShowAgain ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}
              >
                Permanent Skip (Don't show again)
              </span>
            </label>

            <motion.button
              onClick={handleClose}
              whileHover={{ x: 5 }}
              className="flex items-center gap-4 px-8 py-4 rounded-sm text-[12px] font-black uppercase tracking-[0.2em] transition-all"
              style={{
                background: isVideoEnded ? '#c9a44c' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isVideoEnded ? '#c9a44c' : 'rgba(201,164,76,0.4)'}`,
                color: isVideoEnded ? '#0a0a0a' : '#c9a44c',
                boxShadow: isVideoEnded ? '0 15px 40px rgba(201,164,76,0.2)' : 'none'
              }}
            >
              {isVideoEnded ? 'Enter Arena' : 'Skip Briefing'}
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}