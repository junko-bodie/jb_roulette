'use client';

import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';

interface ChipStackProps {
  chips: number[];
  phase?: string;
  className?: string;
  deleteMode?: boolean;
}

export default function ChipStack({ chips, phase, className = '', deleteMode = false }: ChipStackProps) {
  if (chips.length === 0) return null;

  // Show last 4 chips visually in the stack
  const visibleChips = chips.slice(-4);
  const hiddenCount = chips.length - 4;

  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[25px] h-[25px] pointer-events-none ${className}`}>
      {/* Royale Roulette Style Delete Badge */}
      {deleteMode && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-3 -right-3 w-5 h-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg z-[110]"
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-white text-[12px] font-black leading-none">✕</span>
        </motion.div>
      )}

      {visibleChips.map((chipVal, indexInSlice) => {
        const startIdx = Math.max(0, chips.length - 4);
        const originalIndex = startIdx + indexInSlice;

        const chipColor =
          chipVal === 1 ? COLORS.chipWhite :
            chipVal === 5 ? COLORS.chipRed :
              chipVal === 10 ? COLORS.chipBlue :
                chipVal === 25 ? COLORS.chipGreen :
                  chipVal === 100 ? COLORS.chipBlack :
                    chipVal === 500 ? COLORS.chipPurple :
                      chipVal === 1000 ? COLORS.chipYellow :
                        COLORS.gold;

        return (
          <motion.div
            key={`chip-${originalIndex}`}
            initial={{ scale: 2, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: -indexInSlice * 3 }} // Increased offset from 2 to 3
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute inset-0 rounded-full border border-white/20 flex items-center justify-center shadow-lg"
            style={{
              background: chipColor,
              zIndex: originalIndex,
            }}
          >
            <span
              className="text-[11px] font-black select-none pointer-events-none" // Increased from 7px to 11px
              style={{ color: (chipVal === 1 || chipVal === 1000) ? '#000' : '#fff' }}
            >
              {chipVal}
            </span>

            {/* Subtle 3D edge */}
            <div className="absolute inset-0 rounded-full border-b-2 border-black/30 pointer-events-none" />
          </motion.div>
        );
      })}

      {hiddenCount > 0 && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded-sm border border-white/10 shadow-xl z-[100]">
          <span className="text-[9px] font-black text-white leading-tight">
            +{hiddenCount}
          </span>
        </div>
      )}
    </div>
  );
}
