'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinCelebrationProps {
  show: boolean;
  onComplete: () => void;
}

export default function WinCelebration({ show, onComplete }: WinCelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // -50 to 50%
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
          {/* Main Glow Flash */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-[800px] h-[800px] rounded-full bg-gradient-radial from-yellow-400/40 via-yellow-600/10 to-transparent"
          />

          {/* Particle Burst */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{ 
                x: `${p.x}vw`, 
                y: `${p.y}vh`, 
                scale: [0, 1.5, 0.5], 
                opacity: [1, 1, 0],
                rotate: 360
              }}
              transition={{ 
                duration: 1.5 + Math.random(), 
                delay: p.delay,
                ease: "easeOut"
              }}
              className="absolute w-4 h-4 rounded-full border-2 border-yellow-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              }}
            />
          ))}

          {/* WIN Text */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, -20, -40], scale: [0.5, 1.2, 1.2, 1] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute text-6xl font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]"
            style={{ fontFamily: 'var(--font-playfair)', textTransform: 'uppercase', letterSpacing: '0.2em' }}
          >
            Big Win!
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
