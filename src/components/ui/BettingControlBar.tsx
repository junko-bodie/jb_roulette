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
        className="relative w-[2.2rem] h-[2.2rem] sm:w-[2.7rem] sm:h-[2.7rem] rounded-full font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        title="Double all bets"
        style={{
          background: canDouble
            ? `linear-gradient(135deg, ${COLORS.gold}, #e4c97b)`
            : 'linear-gradient(135deg, #d4b896, #a88d7a)',
          color: canDouble ? '#000' : '#fff',
          boxShadow: canDouble
            ? `0 8px 20px rgba(0,0,0,0.6), 0 0 20px ${COLORS.gold}a0, inset 0 3px 0 rgba(255,255,255,0.5)`
            : '0 4px 10px rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.3)',
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: canDouble ? COLORS.gold : '#d4b896',
          fontWeight: 'bold',
        } as React.CSSProperties}
      >
        2X
        {canDouble && (
          <span className="absolute inset-0 rounded-full" style={{
            boxShadow: `inset 0 0 25px ${COLORS.gold}70`,
          }} />
        )}
      </motion.button>

      {/* Delete Mode Toggle Button — Round Chip Style */}
      <motion.button
        onClick={handleDeleteToggle}
        disabled={!canDelete}
        whileHover={canDelete ? { scale: 1.12 } : {}}
        whileTap={canDelete ? { scale: 0.9 } : {}}
        className="relative w-[2.2rem] h-[2.2rem] sm:w-[2.7rem] sm:h-[2.7rem] rounded-full font-black text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        title="Toggle delete mode (tap to remove chip, long press to clear zone)"
        style={{
          background: deleteMode
            ? 'linear-gradient(135deg, #ff7777, #ff3333)'
            : `linear-gradient(135deg, ${COLORS.gold}, #e4c97b)`,
          color: deleteMode ? '#fff' : '#000',
          boxShadow: deleteMode
            ? `0 8px 20px rgba(255,0,0,0.4), 0 0 25px #ff5555dd, inset 0 3px 0 rgba(255,255,255,0.4)`
            : `0 6px 16px rgba(0,0,0,0.5), 0 0 15px ${COLORS.gold}60, inset 0 3px 0 rgba(255,255,255,0.5)`,
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: deleteMode ? '#ffbbbb' : COLORS.gold,
          cursor: 'pointer',
          fontWeight: 'bold',
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
