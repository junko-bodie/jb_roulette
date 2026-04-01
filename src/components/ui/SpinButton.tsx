/**
 * SpinButton — Premium casino spin button
 *
 * Roulette Royale-inspired: weighted press with haptic-like feedback,
 * subtle shimmer, and premium gold-to-dark gradient.
 */

'use client';

import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';

interface SpinButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSpinning: boolean;
}

export default function SpinButton({ onClick, disabled, isSpinning }: SpinButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.96, y: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative overflow-hidden cursor-pointer disabled:cursor-not-allowed"
      style={{
        background: disabled
          ? 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)'
          : `linear-gradient(180deg, #d4af37 0%, #aa8715 40%, #8a6705 100%)`,
        color: disabled ? '#555' : '#ffffff',
        fontFamily: 'var(--font-playfair)',
        fontWeight: 700,
        fontSize: '0.85rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        padding: '10px 32px',
        borderRadius: '8px',
        border: disabled
          ? '1px solid #333'
          : `1px solid ${COLORS.goldLight}`,
        boxShadow: disabled
          ? 'none'
          : `
            0 4px 20px rgba(201, 168, 76, 0.25),
            0 1px 3px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.25),
            inset 0 -1px 0 rgba(0,0,0,0.15)
          `,
      }}
    >
      {/* Shimmer overlay */}
      {!disabled && !isSpinning && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
      )}

      {/* Spinning indicator */}
      {isSpinning && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.1)' }}
        >
          <motion.div
            className="w-5 h-5 border-2 rounded-full"
            style={{ borderColor: '#0a0a0a', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      <span className="relative z-10">
        {isSpinning ? 'SPINNING' : 'SPIN'}
      </span>
    </motion.button>
  );
}
