/**
 * Chip Component — Individual casino chip
 *
 * Renders a premium circular chip with denomination,
 * brand name, and color coding. Used in the tray and on the table.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '@/styles/theme';

interface ChipProps {
  value: number;
  color: string;
  textColor: string;
  label: string;
  isSelected?: boolean;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export default function Chip({
  value,
  color,
  textColor,
  label,
  isSelected = false,
  size = 56,
  onClick,
  className = '',
}: ChipProps) {
  const isDark = color === COLORS.chipBlack || color === COLORS.chipBlue;
  const borderColor = isSelected ? COLORS.gold : 'rgba(255,255,255,0.2)';
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -3, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      className={`relative cursor-pointer select-none rounded-full group ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${label} chip`}
    >
      {/* Dynamic Glow (Selected) */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
              filter: 'blur(8px)',
              zIndex: -1
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Chip Body */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${lighten(color, 15)}, ${color} 60%, ${darken(color, 25)})`,
          boxShadow: `
            0 4px 10px rgba(0,0,0,0.5),
            inset 0 2px 4px rgba(255,255,255,0.2),
            inset 0 -2px 4px rgba(0,0,0,0.3)
          `,
          border: `1px solid ${darken(color, 30)}`
        }}
      >
        {/* CASINO SEGMENTED EDGE (Pattern) */}
        <div className="absolute inset-0 rounded-full opacity-40">
           <svg width="100%" height="100%" viewBox="0 0 100 100">
             {Array.from({ length: 12 }).map((_, i) => (
               <rect
                 key={i}
                 x="46" y="-2" width="8" height="15"
                 fill={i % 2 === 0 ? 'white' : 'transparent'}
                 transform={`rotate(${i * 30} 50 50)`}
               />
             ))}
           </svg>
        </div>

        {/* BRASS / GOLD INLAID RING */}
        <div 
          className="absolute rounded-full border-[1.5px]"
          style={{
            inset: '12%',
            borderColor: isSelected ? COLORS.gold : 'rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.3)',
            background: 'rgba(0,0,0,0.05)'
          }}
        />

        {/* SECONDARY DECORATIVE RING */}
        <div 
          className="absolute rounded-full border border-dashed border-white/10"
          style={{ inset: '22%' }}
        />

        {/* Inner Hub */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            inset: '28%',
            background: `linear-gradient(135deg, ${lighten(color, 5)}, ${darken(color, 10)})`,
            boxShadow: '0 2px 5px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)',
            border: `1px solid ${darken(color, 20)}`
          }}
        >
          <span
            className="font-black tracking-tighter"
            style={{
              color: textColor,
              fontSize: size * 0.22,
              fontFamily: 'var(--font-inter)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))'
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Selected Indicator Ring (External) */}
      {isSelected && (
        <div 
          className="absolute inset-[-4px] rounded-full border-2 border-[#c9a44c] animate-pulse"
          style={{ boxShadow: '0 0 15px #c9a44c66' }}
        />
      )}
    </motion.button>
  );
}

/** Simple color helpers */
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
