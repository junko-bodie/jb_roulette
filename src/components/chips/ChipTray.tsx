/**
 * ChipTray — Premium chip selection tray
 *
 * Smooth entrance with staggered chip reveals.
 * Selected chip has a luxurious glow pulse.
 */

'use client';

import { motion, type Variants } from 'framer-motion';
import { useState, useEffect } from 'react';
import Chip from './Chip';
import { CHIP_DENOMINATIONS, COLORS } from '@/styles/theme';
import { soundEngine } from '@/lib/audioEngine';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

interface ChipTrayProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  balance: number;
  totalBet: number;
  disabled?: boolean;
}

const trayVariants: Variants = {
  hidden: { y: 100, opacity: 0 },
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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const isLandscapeMobile = useMediaQuery('(max-height: 500px) and (orientation: landscape)');
  
  const chipSize = isLandscapeMobile ? 36 : isSmallMobile ? 32 : isMobile ? 40 : 50;
  const availableFunds = balance - totalBet;

  return (
    <motion.div
      variants={trayVariants}
      initial="hidden"
      animate={disabled ? "hidden" : "visible"}
      className={`flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-4 md:px-6 py-1 sm:py-2 w-full ${disabled ? 'pointer-events-none' : ''}`}
      style={{
        background: 'linear-gradient(to top, rgba(5, 25, 30, 0.95), rgba(8, 42, 47, 0.85))',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid rgba(201, 168, 76, 0.25)`,
      }}
    >
      {CHIP_DENOMINATIONS.map((chip) => {
        const canAfford = availableFunds >= chip.value;
        const isSelected = selectedChip === chip.value;
        
        return (
          <motion.div
            key={chip.value}
            variants={chipVariants}
            className="relative"
            style={{
              opacity: disabled ? 0.4 : (canAfford ? 1 : 0.6),
              transition: 'opacity 0.3s ease',
            }}
          >
            <Chip
              value={chip.value}
              color={chip.color}
              textColor={chip.textColor}
              label={chip.label}
              isSelected={isSelected}
              size={chipSize}
              onClick={() => {
                if (!disabled) {
                  soundEngine?.playThump();
                  onSelectChip(chip.value);
                }
              }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
