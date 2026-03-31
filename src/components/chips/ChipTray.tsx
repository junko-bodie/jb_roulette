/**
 * ChipTray — Premium chip selection tray
 *
 * Smooth entrance with staggered chip reveals.
 * Selected chip has a luxurious glow pulse.
 */

'use client';

import { motion, type Variants } from 'framer-motion';
import Chip from './Chip';
import { CHIP_DENOMINATIONS, COLORS } from '@/styles/theme';

interface ChipTrayProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  balance: number;
  totalBet: number;
  disabled?: boolean;
}

const trayVariants: Variants = {
  hidden: { y: 60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
};

const chipVariants: Variants = {
  hidden: { y: 20, opacity: 0, scale: 0.8 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ChipTray({
  selectedChip,
  onSelectChip,
  balance,
  totalBet,
  disabled = false,
}: ChipTrayProps) {
  const availableFunds = balance - totalBet;

  return (
    <motion.div
      variants={trayVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center gap-4 px-6 py-4"
      style={{
        background: 'linear-gradient(to top, rgba(5, 25, 30, 0.95), rgba(8, 42, 47, 0.85))',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid rgba(201, 168, 76, 0.25)`,
      }}
    >
      {CHIP_DENOMINATIONS.map((chip) => {
        const canAfford = availableFunds >= chip.value;
        return (
          <motion.div
            key={chip.value}
            variants={chipVariants}
            className="relative"
            style={{
              opacity: canAfford && !disabled ? 1 : 0.3,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Chip
              value={chip.value}
              color={chip.color}
              textColor={chip.textColor}
              label={chip.label}
              isSelected={selectedChip === chip.value}
              size={56}
              onClick={() => {
                if (canAfford && !disabled) onSelectChip(chip.value);
              }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
