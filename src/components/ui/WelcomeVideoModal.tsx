'use client';

import { useState, useEffect } from 'react';
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
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-[40px] border border-[#c9a44c]/40 shadow-[0_0_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col pt-12"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header Area */}
          <div className="px-10 pb-8 text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-[0.15em] text-[#c9a44c] uppercase italic mb-3" style={{ fontFamily: "'Bodoni Moda', serif" }}>
              Welcome to the Arena
            </h2>
            <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent mx-auto mb-6" />
            <p className="text-white/70 text-sm md:text-lg max-w-xl mx-auto font-medium leading-relaxed">
              Prepare for the most high-stakes roulette tournament in the world. 
              Watch this brief introduction to understand the rules of the house.
            </p>
          </div>

          {/* Video Placeholder Area */}
          <div className="relative aspect-video bg-black w-full border-y border-[#c9a44c]/10">
            {/* Using an iframe or video tag with a placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d2e23] to-black uppercase tracking-[0.3em] font-black text-[#c9a44c]/10 text-4xl select-none italic pointer-events-none">
              Tournament Intro Video
            </div>
            
            <video 
              autoPlay 
              controls 
              className="w-full h-full object-cover relative z-10"
              poster="https://images.unsplash.com/photo-1596838132731-dd3645c19451?q=80&w=2070&auto=format&fit=crop"
            >
              <source src="https://media.w3.org/2010/05/sintel/trailer.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Corner Decorative Elements */}
            <div className="absolute top-6 left-6 z-20 w-10 h-10 border-t-2 border-l-2 border-[#c9a44c]/40 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-6 right-6 z-20 w-10 h-10 border-t-2 border-r-2 border-[#c9a44c]/40 rounded-tr-xl pointer-events-none" />
          </div>

          {/* Controls Footer */}
          <div className="p-12 sm:p-16 flex flex-col sm:flex-row items-center justify-between gap-10 bg-[#0a0a0a] relative z-30">
            <label className="flex items-center gap-5 cursor-pointer group order-2 sm:order-1">
              <div className="relative w-8 h-8 rounded-xl border-2 border-[#c9a44c]/20 group-hover:border-[#c9a44c]/50 transition-all flex items-center justify-center bg-white/5 shadow-inner">
                <input 
                  type="checkbox" 
                  className="peer absolute inset-0 opacity-0 cursor-pointer" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <motion.div 
                  className="w-4 h-4 bg-[#c9a44c] rounded-md shadow-[0_0_15px_rgba(201,164,76,0.6)]"
                  initial={false}
                  animate={{ scale: dontShowAgain ? 1 : 0, opacity: dontShowAgain ? 1 : 0 }}
                />
              </div>
              <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.25em] group-hover:text-white/70 transition-colors">
                Don't show this video again
              </span>
            </label>

            <button 
              onClick={handleClose}
              className="min-w-[240px] px-16 py-5 bg-gradient-to-b from-[#c9a44c] to-[#8a6d2b] text-black font-black uppercase text-sm tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(201,164,76,0.15)] border border-[#ffedb3]/40 order-1 sm:order-2"
            >
              Good Luck Player
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
