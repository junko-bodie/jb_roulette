/**
 * Chip Component — Individual casino chip
 *
 * Renders a premium circular chip with denomination,
 * brand name, and color coding. Used in the tray and on the table.
 */

'use client';

import { motion } from 'framer-motion';
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
  const borderColor = isSelected ? COLORS.gold : 'rgba(255,255,255,0.15)';
  const outerGlow = isSelected ? COLORS.gold : 'transparent';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`relative cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${label} chip`}
    >
      {/* Outer glow ring when selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-[-3px] rounded-full"
          style={{
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            opacity: 0.6,
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Chip body */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${lighten(color, 20)}, ${color} 60%, ${darken(color, 20)})`,
          border: `2.5px solid ${borderColor}`,
          boxShadow: isSelected
            ? `0 0 15px ${outerGlow}40, 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`
            : `0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {/* Edge dashes — casino chip pattern */}
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const r = size / 2 - 4;
            const cx = size / 2;
            const cy = size / 2;
            const x1 = cx + Math.cos(angle) * (r - 5);
            const y1 = cy + Math.sin(angle) * (r - 5);
            const x2 = cx + Math.cos(angle) * r;
            const y2 = cy + Math.sin(angle) * r;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={borderColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Inner ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: size * 0.15,
            border: `1.5px solid ${borderColor}`,
          }}
        />

        {/* Denomination text */}
        <span
          className="relative z-10 font-bold"
          style={{
            color: textColor,
            fontSize: size * 0.24,
            fontFamily: 'var(--font-inter)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}

/** Simple color helpers */
function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `rgb(${r}, ${g}, ${b})`;
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(2.55 * percent));
  return `rgb(${r}, ${g}, ${b})`;
}
