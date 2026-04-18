'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';
import { soundEngine } from '@/lib/audioEngine';

interface BettingControlButtonsProps {
  totalBet: number;
  balance: number;
  onDouble: () => boolean;
  onToggleDelete: () => void;
  deleteMode: boolean;
  disabled: boolean;
}

export default function BettingControlButtons({
  totalBet,
  balance,
  onDouble,
  onToggleDelete,
  deleteMode,
  disabled,
}: BettingControlButtonsProps) {
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);

  const canDouble = balance >= totalBet * 2 && totalBet > 0 && !disabled;
  const canDelete = !disabled && totalBet > 0;

  const handleDouble = () => {
    if (soundEngine) soundEngine.play2XClick();
    const success = onDouble();
    if (!success) {
      setShowInsufficientFunds(true);
      setTimeout(() => setShowInsufficientFunds(false), 2000);
    }
  };

  const handleDeleteToggle = () => {
    if (soundEngine) soundEngine.playSwoosh();
    console.log('Delete toggle clicked, current deleteMode:', deleteMode);
    onToggleDelete();
  };

  return (
    <>
      {/* 2X Button — Round Chip Style */}
      <motion.button
        onClick={handleDouble}
        disabled={!canDouble}
        whileHover={canDouble ? { scale: 1.12 } : {}}
        whileTap={canDouble ? { scale: 0.9 } : {}}
        className="relative w-12 h-12 rounded-full font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        title="Double all bets"
        style={{
          background: canDouble
            ? `linear-gradient(135deg, ${COLORS.gold}, #e4c97b)`
            : 'linear-gradient(135deg, #8b7355, #6b5345)',
          color: canDouble ? '#000' : '#999',
          boxShadow: canDouble
            ? `0 6px 15px rgba(0,0,0,0.5), 0 0 15px ${COLORS.gold}80, inset 0 2px 0 rgba(255,255,255,0.4)`
            : 'inset 0 1px 0 rgba(0,0,0,0.3)',
          border: `3px solid ${canDouble ? COLORS.gold : '#555'}`,
        } as React.CSSProperties}
      >
        2X
        {canDouble && (
          <span className="absolute inset-0 rounded-full" style={{
            boxShadow: `inset 0 0 18px ${COLORS.gold}50`,
          }} />
        )}
      </motion.button>

      {/* Delete Mode Toggle Button — Round Chip Style */}
      <motion.button
        onClick={handleDeleteToggle}
        disabled={!canDelete}
        whileHover={canDelete ? { scale: 1.12 } : {}}
        whileTap={canDelete ? { scale: 0.9 } : {}}
        className="relative w-12 h-12 rounded-full font-black text-base uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        title="Toggle delete mode (tap to remove chip, long press to clear zone)"
        style={{
          background: deleteMode
            ? 'linear-gradient(135deg, #ff4444, #cc2222)'
            : `linear-gradient(135deg, ${COLORS.gold}cc, #b8943f)`,
          color: deleteMode ? '#fff' : '#1a0f09',
          boxShadow: deleteMode
            ? `0 6px 15px rgba(255,0,0,0.3), 0 0 18px #ff4444cc, inset 0 2px 0 rgba(255,255,255,0.3)`
            : `0 4px 12px rgba(0,0,0,0.4), 0 0 10px ${COLORS.gold}40, inset 0 2px 0 rgba(255,255,255,0.4)`,
          border: `3px solid ${deleteMode ? '#ff6666' : COLORS.gold}`,
          cursor: 'pointer',
        } as React.CSSProperties}
      >
        ✕
        {deleteMode && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `inset 0 0 25px #ff444477`,
            } as React.CSSProperties}
            animate={{
              boxShadow: [
                `inset 0 0 25px #ff444477`,
                `inset 0 0 40px #ff444499`,
                `inset 0 0 25px #ff444477`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    </>
  );
}
