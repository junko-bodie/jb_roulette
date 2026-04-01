/**
 * BettingLayout — Full roulette betting table grid
 *
 * Renders the classic roulette layout with all number cells and
 * outside bet zones. Handles chip placement, hover highlighting,
 * and visual chip stacks on placed bets.
 *
 * Layout is CSS Grid-based for precision and responsiveness.
 */

'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';
import { getNumberColor, getDisplayNumber } from '@/lib/rng';
import { type SpinResult } from '@/lib/rng';
import { type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';

interface BettingLayoutProps {
  bets: Map<string, PlacedBet>;
  onPlaceBet: (betId: string) => void;
  onRemoveBet: (betId: string) => void;
  disabled: boolean;
  winningResult: SpinResult | null;
  payoutResult: PayoutResult | null;
  showWinHighlight: boolean;
  phase: string;
}

/**
 * Standard roulette numbers grid layout:
 * Rows go left-to-right: [3,6,9,...,36] (top), [2,5,8,...,35] (mid), [1,4,7,...,34] (bot)
 * But we display columns as rows for typical CSS grid.
 */

// The grid: 12 columns x 3 rows of numbers
// Row 1 (top): 3, 6, 9, ..., 36
// Row 2 (mid): 2, 5, 8, ..., 35
// Row 3 (bot): 1, 4, 7, ..., 34
const GRID_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

function getCellBg(num: number): string {
  const color = getNumberColor(num);
  if (color === 'red') return COLORS.rouletteRed;
  if (color === 'green') return COLORS.rouletteGreen;
  return '#1e1e1e';
}

function ChipIndicator({ bet, phase }: { bet: PlacedBet; phase: string }) {
  const isResetting = phase === 'RESET';
  return (
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col-reverse items-center justify-center pointer-events-none"
    >
      {!isResetting && bet.chips.slice(-4).map((chipVal, indexInSlice) => {
        // Use the absolute index of the chip in the array as the key
        // This ensures Framer Motion animates exactly the newly placed chips!
        const startIdx = Math.max(0, bet.chips.length - 4);
        const originalIndex = startIdx + indexInSlice;
        const chipColor =
          chipVal === 1 ? COLORS.chipWhite :
          chipVal === 5 ? COLORS.chipRed :
          chipVal === 25 ? COLORS.chipGreen :
          chipVal === 100 ? COLORS.chipBlack :
          COLORS.chipPurple;

        return (
          <motion.div
            key={`chip-${originalIndex}`}
            initial={{ scale: 2, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center"
            style={{
              background: chipColor,
              marginTop: indexInSlice > 0 ? '-6px' : 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.5), inset 0 0 4px rgba(255,255,255,0.4)',
              zIndex: originalIndex,
            }}
          >
            <span className="text-[6px] font-bold" style={{ color: chipVal === 1 ? '#000' : '#fff' }}>
              {chipVal}
            </span>
          </motion.div>
        );
      })}
      {bet.chips.length > 4 && (
        <span className="text-[8px] font-bold text-white shadow-sm bg-black/50 px-1 rounded-full mt-0.5">+{bet.chips.length - 4}</span>
      )}
    </div>
  );
}

/** Single number cell */
function NumberCell({
  num,
  betId,
  bet,
  onPlace,
  onRemove,
  disabled,
  isWinner,
  phase,
}: {
  num: number;
  betId: string;
  bet: PlacedBet | undefined;
  onPlace: () => void;
  onRemove: () => void;
  disabled: boolean;
  isWinner: boolean;
  phase: string;
}) {
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && bet) onRemove();
    },
    [disabled, bet, onRemove]
  );

  const handlePlace = () => {
    if (!disabled) {
      soundEngine?.playChipSound();
      onPlace();
    }
  };

  return (
    <motion.button
      onClick={handlePlace}
      onContextMenu={handleContextMenu}
      className="relative flex items-center justify-center cursor-pointer select-none text-[9px] sm:text-[11px] md:text-sm min-h-[28px] sm:min-h-[40px] md:min-h-[48px]"
      style={{
        background: getCellBg(num),
        border: '1px solid #5ea896',
        fontFamily: 'var(--font-inter)',
        fontWeight: 600,
        color: '#fff',
        transition: 'all 0.15s ease',
      }}
      whileHover={
        disabled
          ? {}
          : {
              borderColor: COLORS.gold,
              boxShadow: `inset 0 0 12px rgba(201, 168, 76, 0.25)`,
            }
      }
      animate={
        isWinner
          ? {
              boxShadow: [
                `inset 0 0 0px ${COLORS.gold}00`,
                `inset 0 0 20px ${COLORS.gold}80`,
                `inset 0 0 0px ${COLORS.gold}00`,
              ],
              borderColor: COLORS.gold,
            }
          : {}
      }
      transition={isWinner ? { duration: 1, repeat: 3 } : { duration: 0.15 }}
    >
      {getDisplayNumber(num)}
      {bet && <ChipIndicator bet={bet} phase={phase} />}
    </motion.button>
  );
}

/** Invisible drop zone for combination bets (splits, corners, streets) */
function DropZone({
  betId,
  x,
  y,
  width = '14px',
  height = '14px',
  bets,
  onPlace,
  onRemove,
  disabled,
  isWinner,
  phase,
}: {
  betId: string;
  x: string;
  y: string;
  width?: string;
  height?: string;
  bets: Map<string, PlacedBet>;
  onPlace: (betId: string) => void;
  onRemove: (betId: string) => void;
  disabled: boolean;
  isWinner: boolean;
  phase: string;
}) {
  const bet = bets.get(betId);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && bet) onRemove(betId);
    },
    [disabled, bet, onRemove, betId]
  );

  return (
    <div
      className="absolute z-20"
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto', // Because parent has pointer-events: none
      }}
    >
      <motion.button
        className="w-full h-full rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(200,160,50,0.2) 60%, transparent 100%)',
        }}
        onClick={() => {
          if (!disabled) {
            soundEngine?.playChipSound();
            onPlace(betId);
          }
        }}
        onContextMenu={handleContextMenu}
        whileHover={disabled ? {} : { scale: 1.2 }}
      />
      {bet && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <ChipIndicator bet={bet} phase={phase} />
        </div>
      )}
      {isWinner && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400 pointer-events-none"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: 3 }}
        />
      )}
    </div>
  );
}

/** Outside bet cell */
function OutsideBetCell({
  betId,
  label,
  bet,
  onPlace,
  onRemove,
  disabled,
  isWinner,
  style,
  className = '',
  isRed,
  phase,
}: {
  betId: string;
  label: string;
  bet: PlacedBet | undefined;
  onPlace: () => void;
  onRemove: () => void;
  disabled: boolean;
  isWinner: boolean;
  style?: React.CSSProperties;
  className?: string;
  isRed?: boolean;
  phase: string;
}) {
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && bet) onRemove();
    },
    [disabled, bet, onRemove]
  );

  const handlePlace = () => {
    if (!disabled) {
      soundEngine?.playChipSound();
      onPlace();
    }
  };

  return (
    <motion.button
      onClick={handlePlace}
      onContextMenu={handleContextMenu}
      className={`relative flex items-center justify-center cursor-pointer select-none text-[7px] sm:text-[9px] md:text-xs min-h-[24px] sm:min-h-[32px] md:min-h-[36px] ${className}`}
      style={{
        background: isRed === true ? COLORS.rouletteRed : isRed === false ? '#1e1e1e' : 'transparent',
        border: '1px solid #5ea896',
        fontFamily: 'var(--font-inter)',
        fontWeight: 600,
        color: '#fff',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'all 0.15s ease',
        ...style,
      }}
      whileHover={
        disabled
          ? {}
          : {
              borderColor: COLORS.gold,
              boxShadow: `inset 0 0 12px rgba(201, 168, 76, 0.25)`,
            }
      }
      animate={
        isWinner
          ? {
              boxShadow: [
                `inset 0 0 0px ${COLORS.gold}00`,
                `inset 0 0 15px ${COLORS.gold}80`,
                `inset 0 0 0px ${COLORS.gold}00`,
              ],
              borderColor: COLORS.gold,
            }
          : {}
      }
      transition={isWinner ? { duration: 1, repeat: 3 } : { duration: 0.15 }}
    >
      {label}
      {bet && <ChipIndicator bet={bet} phase={phase} />}
    </motion.button>
  );
}

export default function BettingLayout({
  bets,
  onPlaceBet,
  onRemoveBet,
  disabled,
  winningResult,
  payoutResult,
  showWinHighlight,
  phase,
}: BettingLayoutProps) {
  // Check if a specific bet zone won
  const isBetWinner = useCallback(
    (betId: string): boolean => {
      if (!showWinHighlight || !payoutResult) return false;
      return payoutResult.outcomes.some((o) => o.betId === betId && o.isWin);
    },
    [showWinHighlight, payoutResult]
  );

  // Check if a number is the winning number
  const isWinningNumber = useCallback(
    (num: number): boolean => {
      if (!showWinHighlight || !winningResult) return false;
      return winningResult.number === num;
    },
    [showWinHighlight, winningResult]
  );

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2">
      {/* Main grid area */}
      <div
        className="w-full rounded-lg overflow-hidden"
        style={{
          background: 'transparent',
          border: `1px solid #5ea896`,
          boxShadow: `0 0 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(30, 77, 43, 0.1)`,
        }}
      >
        {/* Zero row */}
        <div className="grid grid-cols-[32px_1fr] sm:grid-cols-[48px_1fr] md:grid-cols-[60px_1fr] gap-0">
          {/* 0 and 00 */}
          <div className="grid grid-rows-2 gap-0 relative">
            <NumberCell
              num={0}
              betId="straight-0"
              bet={bets.get('straight-0')}
              onPlace={() => onPlaceBet('straight-0')}
              onRemove={() => onRemoveBet('straight-0')}
              disabled={disabled}
              isWinner={isWinningNumber(0) || isBetWinner('straight-0')}
              phase={phase}
            />
            <NumberCell
              num={37}
              betId="straight-00"
              bet={bets.get('straight-00')}
              onPlace={() => onPlaceBet('straight-00')}
              onRemove={() => onRemoveBet('straight-00')}
              disabled={disabled}
              isWinner={isWinningNumber(37) || isBetWinner('straight-00')}
              phase={phase}
            />
            
            {/* Split 0-00 target */}
            <DropZone
              betId="split-0-00"
              x="50%"
              y="50%"
              width="24px"
              height="14px"
              bets={bets}
              onPlace={onPlaceBet}
              onRemove={onRemoveBet}
              disabled={disabled}
              isWinner={isBetWinner('split-0-00')}
              phase={phase}
            />
          </div>

          {/* Number grid: 3 rows x 12 columns */}
          <div className="grid grid-rows-3 gap-0 relative">
            {GRID_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-12 gap-0">
                {row.map((num) => {
                  const betId = `straight-${num}`;
                  return (
                    <NumberCell
                      key={num}
                      num={num}
                      betId={betId}
                      bet={bets.get(betId)}
                      onPlace={() => onPlaceBet(betId)}
                      onRemove={() => onRemoveBet(betId)}
                      disabled={disabled}
                      isWinner={isWinningNumber(num) || isBetWinner(betId)}
                      phase={phase}
                    />
                  );
                })}
              </div>
            ))}

            {/* COMBINATION BETS OVERLAY (Splits, Corners, Streets) */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Vertical Splits (left/right on screen) e.g., 1|4 */}
              {Array.from({ length: 11 }).map((_, c) =>
                [0, 1, 2].map((r) => {
                  const num = 2 - r + 1 + c * 3;
                  const betId = `split-${num}-${num + 3}`;
                  return (
                    <DropZone
                      key={betId}
                      betId={betId}
                      x={`${(c + 1) * (100 / 12)}%`}
                      y={`${(r + 0.5) * (100 / 3)}%`}
                      width="12px"
                      height="20px"
                      bets={bets}
                      onPlace={onPlaceBet}
                      onRemove={onRemoveBet}
                      disabled={disabled}
                      isWinner={isBetWinner(betId)}
                      phase={phase}
                    />
                  );
                })
              )}

              {/* Horizontal Splits (top/bottom on screen) e.g., 1|2 */}
              {Array.from({ length: 12 }).map((_, c) =>
                [0, 1].map((r) => {
                  const lowerNum = 2 - (r + 1) + 1 + c * 3;
                  const betId = `split-${lowerNum}-${lowerNum + 1}`;
                  return (
                    <DropZone
                      key={betId}
                      betId={betId}
                      x={`${(c + 0.5) * (100 / 12)}%`}
                      y={`${(r + 1) * (100 / 3)}%`}
                      width="20px"
                      height="12px"
                      bets={bets}
                      onPlace={onPlaceBet}
                      onRemove={onRemoveBet}
                      disabled={disabled}
                      isWinner={isBetWinner(betId)}
                      phase={phase}
                    />
                  );
                })
              )}

              {/* Corners e.g., 1|2|4|5 */}
              {Array.from({ length: 11 }).map((_, c) =>
                [0, 1].map((r) => {
                  const lowerNum = 2 - (r + 1) + 1 + c * 3;
                  const betId = `corner-${lowerNum}-${lowerNum + 1}-${lowerNum + 3}-${lowerNum + 4}`;
                  return (
                    <DropZone
                      key={betId}
                      betId={betId}
                      x={`${(c + 1) * (100 / 12)}%`}
                      y={`${(r + 1) * (100 / 3)}%`}
                      width="16px"
                      height="16px"
                      bets={bets}
                      onPlace={onPlaceBet}
                      onRemove={onRemoveBet}
                      disabled={disabled}
                      isWinner={isBetWinner(betId)}
                      phase={phase}
                    />
                  );
                })
              )}

              {/* Streets e.g., 1|2|3 */}
              {Array.from({ length: 12 }).map((_, c) => {
                const base = c * 3 + 1;
                const betId = `street-${base}-${base + 1}-${base + 2}`;
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={`${(c + 0.5) * (100 / 12)}%`}
                    y="100%"
                    width="24px"
                    height="12px"
                    bets={bets}
                    onPlace={onPlaceBet}
                    onRemove={onRemoveBet}
                    disabled={disabled}
                    isWinner={isBetWinner(betId)}
                    phase={phase}
                  />
                );
              })}

              {/* Sixlines e.g., 1-6 */}
              {Array.from({ length: 11 }).map((_, c) => {
                const base = c * 3 + 1;
                const betId = `sixline-${base}-${base + 5}`;
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={`${(c + 1) * (100 / 12)}%`}
                    y="100%"
                    width="16px"
                    height="16px"
                    bets={bets}
                    onPlace={onPlaceBet}
                    onRemove={onRemoveBet}
                    disabled={disabled}
                    isWinner={isBetWinner(betId)}
                    phase={phase}
                  />
                );
              })}

              {/* Trio and Basket (placed on the left border of the 1..36 grid, adjoining 0/00) */}
              <DropZone
                betId="basket-0-00-1-2-3"
                x="0%"
                y="100%"
                width="16px"
                height="16px"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('basket-0-00-1-2-3')}
                phase={phase}
              />
              <DropZone
                betId="basket-0-1-2-3"
                x="0%"
                y="100%"
                width="16px"
                height="16px" // Only 1 basket bet usually active depending on wheel logic, overlay is fine
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('basket-0-1-2-3')}
                phase={phase}
              />
              <DropZone
                betId="trio-0-1-2"
                x="0%"
                y={`${2 * (100 / 3)}%`}
                width="16px"
                height="16px"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('trio-0-1-2')}
                phase={phase}
              />
              <DropZone
                betId="trio-00-2-3"
                x="0%"
                y={`${1 * (100 / 3)}%`}
                width="16px"
                height="16px"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('trio-00-2-3')}
                phase={phase}
              />
              <DropZone
                betId="trio-0-2-3"
                x="0%"
                y={`${1 * (100 / 3)}%`}
                width="16px"
                height="16px"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('trio-0-2-3')}
                phase={phase}
              />
            </div>
          </div>
        </div>

        {/* Dozens row */}
        <div className="grid grid-cols-[32px_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr] md:grid-cols-[60px_1fr_1fr_1fr] gap-0">
          <div />
          {['dozen-1st', 'dozen-2nd', 'dozen-3rd'].map((betId, i) => (
            <OutsideBetCell
              key={betId}
              betId={betId}
              label={`${i + 1}st 12`}
              bet={bets.get(betId)}
              onPlace={() => onPlaceBet(betId)}
              onRemove={() => onRemoveBet(betId)}
              disabled={disabled}
              isWinner={isBetWinner(betId)}
              phase={phase}
            />
          ))}
        </div>

        {/* Even-money bets row */}
        <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr] gap-0">
          <div />
          <OutsideBetCell
            betId="low"
            label="1-18"
            bet={bets.get('low')}
            onPlace={() => onPlaceBet('low')}
            onRemove={() => onRemoveBet('low')}
            disabled={disabled}
            isWinner={isBetWinner('low')}
            phase={phase}
          />
          <OutsideBetCell
            betId="even"
            label="Even"
            bet={bets.get('even')}
            onPlace={() => onPlaceBet('even')}
            onRemove={() => onRemoveBet('even')}
            disabled={disabled}
            isWinner={isBetWinner('even')}
            phase={phase}
          />
          <OutsideBetCell
            betId="red"
            label="Red"
            isRed={true}
            bet={bets.get('red')}
            onPlace={() => onPlaceBet('red')}
            onRemove={() => onRemoveBet('red')}
            disabled={disabled}
            isWinner={isBetWinner('red')}
            phase={phase}
          />
          <OutsideBetCell
            betId="black"
            label="Black"
            isRed={false}
            bet={bets.get('black')}
            onPlace={() => onPlaceBet('black')}
            onRemove={() => onRemoveBet('black')}
            disabled={disabled}
            isWinner={isBetWinner('black')}
            phase={phase}
          />
          <OutsideBetCell
            betId="odd"
            label="Odd"
            bet={bets.get('odd')}
            onPlace={() => onPlaceBet('odd')}
            onRemove={() => onRemoveBet('odd')}
            disabled={disabled}
            isWinner={isBetWinner('odd')}
            phase={phase}
          />
          <OutsideBetCell
            betId="high"
            label="19-36"
            bet={bets.get('high')}
            onPlace={() => onPlaceBet('high')}
            onRemove={() => onRemoveBet('high')}
            disabled={disabled}
            isWinner={isBetWinner('high')}
            phase={phase}
          />
        </div>

        {/* Column bets (at the right edge of each row) */}
        <div className="grid grid-cols-[32px_1fr] sm:grid-cols-[48px_1fr] md:grid-cols-[60px_1fr] gap-0">
          <div />
          <div className="grid grid-cols-3 gap-0">
            {['column-3rd', 'column-2nd', 'column-1st'].map((betId) => (
              <OutsideBetCell
                key={betId}
                betId={betId}
                label="2:1"
                bet={bets.get(betId)}
                onPlace={() => onPlaceBet(betId)}
                onRemove={() => onRemoveBet(betId)}
                disabled={disabled}
                isWinner={isBetWinner(betId)}
                phase={phase}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
