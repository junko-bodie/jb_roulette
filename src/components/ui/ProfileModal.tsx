'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_AVATARS = [
  'default',
  'crown',
  'diamond',
  'star',
  'spade',
  'heart',
  'club',
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { userProfile, setUserProfile } = useGame();
  const [name, setName] = useState(userProfile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatar);

  const handleSave = () => {
    setUserProfile({ name, avatar: selectedAvatar });
    onClose();
  };

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
              <h2 className="text-xl font-bold text-[#c9a44c] tracking-wide">EDIT PROFILE</h2>
              <button onClick={onClose} className="text-[#c9a44c] hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#c9a44c] uppercase tracking-widest">Player Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-[#c9a44c]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#c9a44c] transition-colors"
                  placeholder="Enter your name..."
                />
              </div>

              {/* Avatar Selection */}
              <div className="space-y-4">
                <label className="text-sm font-black text-[#c9a44c] uppercase tracking-widest">Select Avatar</label>
                <div className="grid grid-cols-4 gap-4">
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                        selectedAvatar === avatar 
                        ? 'bg-[#c9a44c] text-black ring-4 ring-[#c9a44c]/20 scale-105' 
                        : 'bg-black/40 text-[#c9a44c] hover:bg-black/60'
                      }`}
                    >
                      <AvatarIcon type={avatar} className="w-8 h-8" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black/40 px-6 py-4 flex justify-end space-x-4">
               <button
                onClick={onClose}
                className="px-6 py-2 border border-[#c9a44c]/20 text-[#c9a44c] font-black rounded-lg hover:bg-white/5 transition-colors uppercase text-sm tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#c9a44c] text-black font-black rounded-lg hover:bg-[#e5b85d] transition-colors uppercase text-sm tracking-widest shadow-lg shadow-[#c9a44c]/20"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AvatarIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'default':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
        </svg>
      );
    // Add other cases as needed...
    default:
      return (
        <div className={className + " font-bold flex items-center justify-center uppercase"}>
          {type[0]}
        </div>
      );
  }
}
