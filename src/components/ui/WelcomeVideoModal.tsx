'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeVideoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem('hideWelcomeVideo');
    if (!hidden) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeVideo', 'true');
    }
    setIsOpen(false);
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
          className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-[32px] border border-[#c9a44c]/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pt-8"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header Area */}
          <div className="px-8 pb-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-widest text-[#c9a44c] uppercase italic mb-2" style={{ fontFamily: "'Bodoni Moda', serif" }}>
              Welcome to the Arena
            </h2>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent mx-auto mb-4" />
            <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto">
              Prepare for the most high-stakes roulette tournament in the world. 
              Watch this brief introduction to understand the rules of the house.
            </p>
          </div>

          {/* Video Placeholder Area */}
          <div className="relative aspect-video bg-black w-full group">
            {/* Using an iframe or video tag with a placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d2e23] to-black uppercase tracking-[0.3em] font-black text-[#c9a44c]/20 text-4xl select-none italic pointer-events-none">
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
            <div className="absolute top-4 left-4 z-20 w-8 h-8 border-t-2 border-l-2 border-[#c9a44c]/50 rounded-tl-lg" />
            <div className="absolute top-4 right-4 z-20 w-8 h-8 border-t-2 border-r-2 border-[#c9a44c]/50 rounded-tr-lg" />
          </div>

          {/* Controls Footer */}
          <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0f0f0f]">
            <label className="flex items-center gap-3 cursor-pointer group order-2 sm:order-1">
              <div className="relative w-6 h-6 rounded-md border-2 border-[#c9a44c]/30 group-hover:border-[#c9a44c]/60 transition-colors flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="peer absolute inset-0 opacity-0 cursor-pointer" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <motion.div 
                  className="w-3 h-3 bg-[#c9a44c] rounded-sm"
                  initial={false}
                  animate={{ scale: dontShowAgain ? 1 : 0, opacity: dontShowAgain ? 1 : 0 }}
                />
              </div>
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider group-hover:text-white/60 transition-colors">
                Don't show this video again
              </span>
            </label>

            <button 
              onClick={handleClose}
              className="px-12 py-4 bg-gradient-to-b from-[#c9a44c] to-[#a68434] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(201,164,76,0.3)] order-1 sm:order-2"
            >
              Good Luck Player
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
