'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { isSoundEnabled, setIsSoundEnabled, isTimerEnabled, setIsTimerEnabled, isTournamentMode } = useGame();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#1a1a1a] border-2 border-[#c9a44c]/40 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-[#c9a44c]/10 px-6 py-4 border-b border-[#c9a44c]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#c9a44c] tracking-wide">GAME SETTINGS</h2>
              <button onClick={onClose} className="text-[#c9a44c] hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-lg font-bold text-white group-hover:text-[#c9a44c] transition-colors">SOUND EFFECTS</span>
                  <p className="text-sm text-gray-400">Enable or disable game audio</p>
                </div>
                <button
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isSoundEnabled ? 'bg-[#c9a44c]' : 'bg-gray-700'}`}
                >
                  <motion.div
                    animate={{ x: isSoundEnabled ? 28 : 4 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>

              {/* Timer Toggle */}
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-lg font-bold text-white group-hover:text-[#c9a44c] transition-colors">BETTING TIMER</span>
                  <p className="text-sm text-gray-400">Auto-spin when time runs out</p>
                  {isTournamentMode && (
                    <p className="text-[10px] text-[#c9a44c] font-black uppercase">Mandatory in Tournament</p>
                  )}
                </div>
                <button
                  disabled={isTournamentMode}
                  onClick={() => setIsTimerEnabled(!isTimerEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isTimerEnabled ? 'bg-[#c9a44c]' : 'bg-gray-700'} ${isTournamentMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <motion.div
                    animate={{ x: isTimerEnabled ? 28 : 4 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black/40 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#c9a44c] text-black font-black rounded-lg hover:bg-[#e5b85d] transition-colors uppercase text-sm tracking-widest"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
