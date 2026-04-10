'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';

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
    const success = onDouble();
    if (!success) {
      setShowInsufficientFunds(true);
      setTimeout(() => setShowInsufficientFunds(false), 2000);
    }
  };

  const handleDeleteToggle = () => {
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
        className="relative w-10 h-10 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        title="Double all bets"
        style={{
          background: canDouble
            ? `linear-gradient(135deg, ${COLORS.gold}, #e4c97b)`
            : 'linear-gradient(135deg, #8b7355, #6b5345)',
          color: canDouble ? '#000' : '#999',
          boxShadow: canDouble
            ? `0 0 12px ${COLORS.gold}80, inset 0 1px 0 rgba(255,255,255,0.3)`
            : 'inset 0 1px 0 rgba(0,0,0,0.3)',
          border: `2px solid ${canDouble ? COLORS.gold : '#555'}`,
        }}
      >
        2X
        {canDouble && (
          <span className="absolute inset-0 rounded-full" style={{
            boxShadow: `inset 0 0 15px ${COLORS.gold}40`,
          }} />
        )}
      </motion.button>

      {/* Delete Mode Toggle Button — Round Chip Style */}
      <motion.button
        onClick={handleDeleteToggle}
        disabled={!canDelete}
        whileHover={canDelete ? { scale: 1.12 } : {}}
        whileTap={canDelete ? { scale: 0.9 } : {}}
        className="relative w-10 h-10 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        title="Toggle delete mode (tap to remove chip, long press to clear zone)"
        style={{
          background: deleteMode
            ? 'linear-gradient(135deg, #ff4444, #cc2222)'
            : 'linear-gradient(135deg, #8b7355, #6b5345)',
          color: deleteMode ? '#fff' : '#9a8080',
          boxShadow: deleteMode
            ? `0 0 15px #ff4444cc, inset 0 1px 0 rgba(255,255,255,0.2)`
            : 'inset 0 1px 0 rgba(0,0,0,0.3)',
          border: `2px solid ${deleteMode ? '#ff6666' : '#666'}`,
          cursor: 'pointer',
        }}
      >
        ✕
        {deleteMode && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `inset 0 0 20px #ff444466`,
            }}
            animate={{
              boxShadow: [
                `inset 0 0 25px #ff444466`,
                `inset 0 0 35px #ff444488`,
                `inset 0 0 25px #ff444466`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    </>
  );
}
