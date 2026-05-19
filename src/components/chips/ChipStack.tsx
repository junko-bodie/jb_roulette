'use client';

import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';

interface ChipStackProps {
  chips: number[];
  phase?: string;
  className?: string;
  deleteMode?: boolean;
  isMine?: boolean;
  customColor?: string;
  playerInitial?: string;
  isHovered?: boolean;
}

/** Simple color helpers (same as Chip.tsx) */
function lighten(hex: string, percent: number): string {
  if (!hex || hex[0] !== '#') return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function darken(hex: string, percent: number): string {
  if (!hex || hex[0] !== '#') return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function getChipColor(val: number): string {
  switch (val) {
    case 1: return COLORS.chipWhite;
    case 2: return COLORS.chipOrange;
    case 5: return COLORS.chipRed;
    case 10: return COLORS.chipBlue;
    case 25: return COLORS.chipGreen;
    case 100: return COLORS.chipBlack;
    case 500: return COLORS.chipPurple;
    case 1000: return COLORS.chipYellow;
    default: return COLORS.gold;
  }
}

function getChipTextColor(val: number): string {
  if (val === 1 || val === 1000) return '#000';
  if (val === 100) return COLORS.gold;
  return '#fff';
}

/** Premium mini-chip rendered on the table — mirrors the tray chip design at small scale */
function MiniChip({ chipVal, yOffset, zIndex, customColor }: {
  chipVal: number;
  yOffset: number;
  zIndex: number;
  customColor?: string;
}) {
  const color = getChipColor(chipVal);
  const textColor = getChipTextColor(chipVal);
  const size = 25;

  return (
    <motion.div
      initial={{ scale: 2, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: yOffset }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
      style={{
        width: size,
        height: size,
        zIndex,
        boxShadow: customColor
          ? `0 0 6px ${customColor}80, 0 2px 4px rgba(0,0,0,0.6)`
          : '0 2px 5px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(201, 168, 76, 0.75)',
      }}
    >
      {/* Main chip body — radial gradient for 3D curvature */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${lighten(color, 18)}, ${color} 55%, ${darken(color, 28)})`,
          boxShadow: `
            inset 0 1px 3px rgba(255,255,255,0.2),
            inset 0 -1px 3px rgba(0,0,0,0.4)
          `,
          border: `1.5px solid rgba(201, 168, 76, 0.6)`,
        }}
      />

      {/* Edge segments — casino stripe pattern with gold tint */}
      <div className="absolute inset-0 rounded-full opacity-40 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="45" y="-2" width="10" height="15"
              fill={i % 2 === 0 ? '#e8d5a0' : 'transparent'}
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>
      </div>

      {/* Gold/brass inlay ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '12%',
          border: '1.5px solid rgba(201, 168, 76, 0.45)',
          boxShadow: 'inset 0 0 3px rgba(0,0,0,0.3)',
          background: 'rgba(0,0,0,0.06)',
        }}
      />

      {/* Inner hub with denomination */}
      <div
        className="absolute rounded-full flex items-center justify-center pointer-events-none"
        style={{
          inset: '25%',
          background: `linear-gradient(135deg, ${lighten(color, 6)}, ${darken(color, 12)})`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.12)',
          border: `1px solid ${darken(color, 22)}`,
        }}
      >
        <span
          className="font-black select-none pointer-events-none leading-none"
          style={{
            color: textColor,
            fontSize: size * 0.28,
            fontFamily: "'Georgia', serif",
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
            letterSpacing: '-0.5px',
          }}
        >
          {chipVal}
        </span>
      </div>

      {/* Custom color border for tournament opponents */}
      {customColor && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${customColor}`,
            boxShadow: `0 0 6px ${customColor}60`,
          }}
        />
      )}
    </motion.div>
  );
}

export default function ChipStack({ chips, phase, className = '', deleteMode = false, isMine = true, customColor, playerInitial, isHovered = false }: ChipStackProps) {
  if (chips.length === 0) return null;

  // Show last 4 chips visually in the stack
  const visibleChips = chips.slice(-4);
  const hiddenCount = chips.length - 4;

  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[25px] h-[25px] pointer-events-none ${className}`}>
      {/* Royale Roulette Style Delete Badge */}
      {deleteMode && isMine && (
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

        return (
          <MiniChip
            key={`chip-${originalIndex}`}
            chipVal={chipVal}
            yOffset={-indexInSlice * 3}
            zIndex={originalIndex}
            customColor={customColor}
          />
        );
      })}

      {hiddenCount > 0 && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 px-2 py-0.5 rounded-sm border border-[#c9a44c]/40 shadow-xl z-[100]"
        >
          <span className="text-[9px] font-black text-white leading-tight">
            +{hiddenCount}
          </span>
        </motion.div>
      )}

    </div>
  );
}
