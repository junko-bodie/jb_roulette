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

import { useCallback, useMemo, useState, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '@/styles/theme';
import ChipStack from '@/components/chips/ChipStack';
import { getNumberColor, getDisplayNumber } from '@/lib/rng';
import { type SpinResult } from '@/lib/rng';
import { type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';
import { type PlacedBet, BET_MAP } from '@/lib/bets';

interface BettingLayoutProps {
  bets: Map<string, PlacedBet>;
  onPlaceBet: (betId: string) => void;
  onRemoveBet: (betId: string) => void;
  disabled: boolean;
  winningResult: SpinResult | null;
  payoutResult: PayoutResult | null;
  showWinHighlight: boolean;
  phase: string;
  deleteMode?: boolean;
  onPopLastChip?: (betId: string) => void;
  onClearZone?: (betId: string) => void;
  wheelType?: 'american' | 'european';
  myBets?: Map<string, PlacedBet>;
}

// --- Number Mappings for Outside Bets ---
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
const EVEN_NUMBERS = Array.from({ length: 18 }, (_, i) => (i + 1) * 2);
const ODD_NUMBERS = Array.from({ length: 18 }, (_, i) => i * 2 + 1);
const LOW_NUMBERS = Array.from({ length: 18 }, (_, i) => i + 1);
const HIGH_NUMBERS = Array.from({ length: 18 }, (_, i) => i + 19);
const DOZEN_1ST = Array.from({ length: 12 }, (_, i) => i + 1);
const DOZEN_2ND = Array.from({ length: 12 }, (_, i) => i + 13);
const DOZEN_3RD = Array.from({ length: 12 }, (_, i) => i + 25);
const COLUMN_1ST = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
const COLUMN_2ND = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const COLUMN_3RD = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

/**
 * Standard roulette numbers grid layout:
 * Rows go left-to-right: [3,6,9,...,36] (top), [2,5,8,...,35] (mid), [1,4,7,...,34] (bot)
 * But we display columns as rows for typical CSS grid.
 */
const GRID_ROWS = [
  COLUMN_3RD,
  COLUMN_2ND,
  COLUMN_1ST,
];

function getCellBg(num: number): string {
  const color = getNumberColor(num);
  if (color === 'red') return COLORS.rouletteRed;
  if (color === 'green') return COLORS.rouletteGreen;
  return '#1e1e1e';
}

function ChipIndicator({ bet, phase, deleteMode, isMine }: { bet: PlacedBet; phase: string; deleteMode?: boolean; isMine?: boolean }) {
  return <ChipStack chips={bet.chips} phase={phase} deleteMode={deleteMode} isMine={isMine} />;
}

/** Single number cell */
const NumberCell = memo(function NumberCell({
  num,
  bet,
  onPlace,
  onRemove,
  disabled,
  isWinner,
  phase,
  style = {},
  isHovered = false,
  onNumberHover,
  onNumberHoverEnd,
  deleteMode = false,
  onPopLastChip,
  onClearZone,
  isMine = true,
}: {
  num: number;
  bet: PlacedBet | undefined;
  onPlace: () => void;
  onRemove: () => void;
  disabled: boolean;
  isWinner: boolean;
  phase: string;
  style?: React.CSSProperties;
  isHovered?: boolean;
  onNumberHover?: (num: number) => void;
  onNumberHoverEnd?: () => void;
  deleteMode?: boolean;
  onPopLastChip?: (betId: string) => void;
  onClearZone?: (betId: string) => void;
  isMine?: boolean;
}) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Cleanup timer when deleteMode is disabled or component unmounts
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  // Reset state when exiting delete mode
  useEffect(() => {
    if (!deleteMode && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsLongPress(false);
    }
  }, [deleteMode]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && bet) onRemove();
    },
    [disabled, bet, onRemove]
  );

  const handlePointerDown = useCallback(() => {
    if (deleteMode && bet) {
      setIsLongPress(false);
      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        const betId = `straight-${getDisplayNumber(num)}`;
        console.log('Long press on', betId, '- clearing zone');
        setIsLongPress(true);
        onClearZone?.(betId);
      }, 500); // 500ms threshold
    }
  }, [deleteMode, bet, num, onClearZone]);

  const handlePointerUp = useCallback(() => {
    // Cancel the long press timer if it's still running
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If it didn't reach long press duration, do a single pop (OR CLEAR IF IN DELETE MODE)
    if (deleteMode && !isLongPress && bet) {
      const betId = `straight-${getDisplayNumber(num)}`;
      console.log('Delete mode tap on', betId, '- clearing entire zone');
      onClearZone?.(betId);
    }

    setIsLongPress(false);
  }, [deleteMode, isLongPress, bet, num, onClearZone]);

  const handlePointerLeave = useCallback(() => {
    // Cancel the long press timer if leaving
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPress(false);
  }, []);

  const handlePlace = () => {
    if (!disabled) {
      soundEngine?.playChipSound();
      onPlace();
    }
  };

  return (
    <motion.button
      onClick={deleteMode ? undefined : handlePlace}
      onContextMenu={handleContextMenu}
      onPointerDown={deleteMode ? handlePointerDown : undefined}
      onPointerUp={deleteMode ? handlePointerUp : undefined}
      onPointerLeave={deleteMode ? handlePointerLeave : undefined}
      onMouseEnter={() => !disabled && onNumberHover?.(num)}
      onMouseLeave={() => !disabled && onNumberHoverEnd?.()}
      className="relative flex items-center justify-center cursor-pointer select-none text-[9px] sm:text-[11px] md:text-sm min-h-[18px] sm:min-h-[30px] md:min-h-[44px] group"
      initial={{ borderColor: '#5ea896' }}
      style={{
        background: getCellBg(num),
        borderWidth: 0,
        borderStyle: 'solid',
        fontFamily: "'Bodoni Moda', serif",
        fontWeight: 700,
        color: '#fff',
        transition: 'background 0.15s ease, color 0.15s ease',
        cursor: deleteMode && bet ? 'grab' : 'pointer',
        ...style,
      } as React.CSSProperties}
      variants={{
        hover: {
          borderColor: COLORS.gold,
          boxShadow: `inset 0 0 12px rgba(201, 168, 76, 0.25)`,
        }
      }}
      whileHover={disabled || deleteMode ? {} : "hover"}
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
          : isHovered
            ? {
              borderColor: COLORS.gold,
              boxShadow: `inset 0 0 16px rgba(201, 168, 76, 0.4)`,
              scale: 1.02,
            }
            : {
              borderColor: '#5ea896',
              boxShadow: 'none',
              scale: 1
            }
      }
      transition={isWinner ? { duration: 1, repeat: 3 } : { duration: 0.15 }}
    >
      {getDisplayNumber(num)}
      {bet && (
        <>
          <ChipIndicator bet={bet} phase={phase} deleteMode={deleteMode} isMine={isMine} />
          <motion.div
            variants={{
              hover: { opacity: 1, transition: { duration: 0.2 } }
            }}
            initial={{ opacity: 0 }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 bg-black/90 text-[#c9a44c] text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-[#c9a44c]/40 backdrop-blur-sm whitespace-nowrap z-50 pointer-events-none"
          >
            ${bet.amount.toLocaleString()}
          </motion.div>
        </>
      )}

    </motion.button>
  );
});

/** Invisible drop zone for combination bets (splits, corners, streets) */
const DropZone = memo(function DropZone({
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
  numbers = [],
  onHover,
  onHoverEnd,
  deleteMode = false,
  onPopLastChip,
  onClearZone,
  isMine = true,
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
  numbers?: number[];
  onHover?: (nums: number[], betId?: string) => void;
  onHoverEnd?: () => void;
  deleteMode?: boolean;
  onPopLastChip?: (betId: string) => void;
  onClearZone?: (betId: string) => void;
  isMine?: boolean;
}) {
  const bet = bets.get(betId);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Cleanup timer when deleteMode is disabled or component unmounts
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  // Reset state when exiting delete mode
  useEffect(() => {
    if (!deleteMode && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsLongPress(false);
    }
  }, [deleteMode]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && bet) onRemove(betId);
    },
    [disabled, bet, onRemove, betId]
  );

  const handlePointerDown = useCallback(() => {
    if (deleteMode && bet) {
      setIsLongPress(false);
      longPressTimerRef.current = setTimeout(() => {
        console.log('Long press on', betId, '- clearing zone');
        setIsLongPress(true);
        onClearZone?.(betId);
      }, 500);
    }
  }, [deleteMode, bet, betId, onClearZone]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (deleteMode && !isLongPress && bet) {
      console.log('Delete mode tap on', betId, '- clearing entire zone');
      onClearZone?.(betId);
    }
    setIsLongPress(false);
  }, [deleteMode, isLongPress, bet, betId, onClearZone]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPress(false);
  }, []);

  return (
    <motion.div
      className="absolute z-20"
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
      }}
      whileHover="hover"
    >
      <motion.button
        className="w-full h-full rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(200,160,50,0.2) 60%, transparent 100%)',
        } as React.CSSProperties}
        onClick={() => {
          if (!deleteMode && !disabled) {
            soundEngine?.playChipSound();
            onPlace(betId);
          }
        }}
        onPointerDown={deleteMode ? handlePointerDown : undefined}
        onPointerUp={deleteMode ? handlePointerUp : undefined}
        onPointerLeave={deleteMode ? handlePointerLeave : undefined}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => !disabled && onHover?.(numbers, betId)}
        onMouseLeave={() => !disabled && onHoverEnd?.()}
        whileHover={disabled ? {} : { scale: 1.2 }}
      />
      {bet && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <ChipIndicator bet={bet} phase={phase} deleteMode={deleteMode} isMine={isMine} />
          {/* Tooltip */}
          <motion.div
            variants={{
              hover: { opacity: 1, transition: { duration: 0.2 } }
            }}
            initial={{ opacity: 0 }}
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/90 text-[#c9a44c] text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-[#c9a44c]/40 backdrop-blur-sm whitespace-nowrap z-50"
          >
            ${bet.amount.toLocaleString()}
          </motion.div>
        </div>
      )}
      {isWinner && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400 pointer-events-none"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: 3 }}
        />
      )}
    </motion.div>
  );
});

/** Outside bet cell */
const OutsideBetCell = memo(function OutsideBetCell({
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
  numbers = [],
  onHover,
  onHoverEnd,
  betId = '',
  deleteMode = false,
  onPopLastChip,
  onClearZone,
  isMine = true,
}: {
  label: React.ReactNode;
  bet: PlacedBet | undefined;
  onPlace: () => void;
  onRemove: () => void;
  disabled: boolean;
  isWinner: boolean;
  style?: React.CSSProperties;
  className?: string;
  isRed?: boolean;
  phase: string;
  numbers?: number[];
  onHover?: (nums: number[]) => void;
  onHoverEnd?: () => void;
  betId?: string;
  deleteMode?: boolean;
  onPopLastChip?: (betId: string) => void;
  onClearZone?: (betId: string) => void;
  isMine?: boolean;
}) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  // Cleanup timer when deleteMode is disabled or component unmounts
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  // Reset state when exiting delete mode
  useEffect(() => {
    if (!deleteMode && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsLongPress(false);
    }
  }, [deleteMode]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && bet) onRemove();
    },
    [disabled, bet, onRemove]
  );

  const handlePointerDown = useCallback(() => {
    if (deleteMode && bet) {
      setIsLongPress(false);
      longPressTimerRef.current = setTimeout(() => {
        console.log('Long press on', betId, '- clearing zone');
        setIsLongPress(true);
        onClearZone?.(betId);
      }, 500);
    }
  }, [deleteMode, bet, betId, onClearZone]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (deleteMode && !isLongPress && bet) {
      console.log('Delete mode tap on', betId, '- clearing entire zone');
      onClearZone?.(betId);
    }
    setIsLongPress(false);
  }, [deleteMode, isLongPress, bet, betId, onClearZone]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPress(false);
  }, []);

  const handlePlace = () => {
    if (!deleteMode && !disabled) {
      soundEngine?.playChipSound();
      onPlace();
    }
  };

  return (
    <motion.button
      onClick={handlePlace}
      onPointerDown={deleteMode ? handlePointerDown : undefined}
      onPointerUp={deleteMode ? handlePointerUp : undefined}
      onPointerLeave={deleteMode ? handlePointerLeave : undefined}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => !disabled && onHover?.(numbers)}
      onMouseLeave={() => !disabled && onHoverEnd?.()}
      className={`relative flex items-center justify-center cursor-pointer select-none text-[6px] sm:text-[9px] md:text-xs min-h-[24px] sm:min-h-[36px] md:min-h-[42px] group ${className}`}
      initial={{ borderColor: '#5ea896' }}
      style={{
        background: isRed === true ? COLORS.rouletteRed : isRed === false ? '#1e1e1e' : 'transparent',
        borderWidth: 0,
        borderStyle: 'solid',
        fontFamily: "'Bodoni Moda', serif",
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'background 0.15s ease, color 0.15s ease',
        ...style,
      } as React.CSSProperties}
      variants={{
        hover: {
          borderColor: COLORS.gold,
          boxShadow: `inset 0 0 12px rgba(201, 168, 76, 0.25)`,
        }
      }}
      whileHover={disabled ? {} : "hover"}
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
      {bet && (
        <>
          <ChipIndicator bet={bet} phase={phase} deleteMode={deleteMode} isMine={isMine} />
          {/* Tooltip */}
          <motion.div
            variants={{
              hover: { opacity: 1, transition: { duration: 0.2 } }
            }}
            initial={{ opacity: 0 }}
            className="absolute bottom-full mb-1 bg-black/90 text-[#c9a44c] text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-[#c9a44c]/40 backdrop-blur-sm whitespace-nowrap z-50 pointer-events-none"
          >
            ${bet.amount.toLocaleString()}
          </motion.div>
        </>
      )}
    </motion.button>
  );
});

const BettingLayout = memo(function BettingLayout({
  bets,
  onPlaceBet,
  onRemoveBet,
  disabled,
  winningResult,
  payoutResult,
  showWinHighlight,
  phase,
  deleteMode = false,
  onPopLastChip,
  onClearZone,
  wheelType = 'american',
  myBets,
}: BettingLayoutProps) {
  const [hoveredNumbers, setHoveredNumbers] = useState<number[]>([]);
  const [hoveredBetId, setHoveredBetId] = useState<string | null>(null);
  const [selfHoveredNumber, setSelfHoveredNumber] = useState<number | null>(null);

  // Check if a specific bet zone won
  const isBetWinner = useCallback(
    (betId: string): boolean => {
      if (!showWinHighlight || !payoutResult) return false;
      return payoutResult.outcomes?.some((o) => o.betId === betId && o.isWin) || false;
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

  const handleHover = useCallback((nums: number[], betId?: string) => {
    setHoveredNumbers(nums);
    setHoveredBetId(betId ?? null);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredNumbers([]);
    setHoveredBetId(null);
  }, []);

  const handleNumberHover = useCallback((num: number) => {
    setSelfHoveredNumber(num);
  }, []);

  const handleNumberHoverEnd = useCallback(() => {
    setSelfHoveredNumber(null);
  }, []);

  return (
    <div className="flex flex-col items-center w-full mx-auto p-1">
      {/* SECTION 1: Top Part (Zeros, Numbers, Columns) */}
      <div
        className="grid grid-cols-[32px_1fr_32px] sm:grid-cols-[48px_1fr_40px] md:grid-cols-[60px_1fr_48px] gap-0 w-full"
        style={{ boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
      >
        {/* ZEROS BLOCK */}
        <div className={`grid ${wheelType === 'american' ? 'grid-rows-2' : 'grid-rows-1'} gap-0 border-l border-t border-[#5ea896] rounded-tl-lg overflow-hidden bg-black/10 relative`}>
          <NumberCell
            num={0}
            bet={bets.get('straight-0')}
            onPlace={() => onPlaceBet('straight-0')}
            onRemove={() => onRemoveBet('straight-0')}
            disabled={disabled}
            isWinner={isWinningNumber(0) || isBetWinner('straight-0')}
            phase={phase}
            style={{ borderWidth: '0 1px 1px 0' }}
            isHovered={hoveredNumbers.includes(0)}
            onNumberHover={handleNumberHover}
            onNumberHoverEnd={handleNumberHoverEnd}
            deleteMode={deleteMode}
            onPopLastChip={onPopLastChip}
            onClearZone={onClearZone}
            isMine={myBets ? myBets.has('straight-0') : true}
          />
          {wheelType === 'american' && (
            <NumberCell
              num={37}
              bet={bets.get('straight-00')}
              onPlace={() => onPlaceBet('straight-00')}
              onRemove={() => onRemoveBet('straight-00')}
              disabled={disabled}
              deleteMode={deleteMode}
              onPopLastChip={onPopLastChip}
              onClearZone={onClearZone}
              isWinner={isWinningNumber(37) || isBetWinner('straight-00')}
              phase={phase}
              style={{ borderWidth: '0 1px 1px 0' }}
              isHovered={hoveredNumbers.includes(37)}
              onNumberHover={handleNumberHover}
              onNumberHoverEnd={handleNumberHoverEnd}
              isMine={myBets ? myBets.has('straight-00') : true}
            />
          )}
          {/* Split 0-00 target (American only) */}
          {wheelType === 'american' && (
            <DropZone
              betId="split-0-00"
              x="50%"
              y="50%"
              bets={bets}
              onPlace={onPlaceBet}
              onRemove={onRemoveBet}
              disabled={disabled}
              isWinner={isBetWinner('split-0-00')}
              phase={phase}
              numbers={[0, 37]}
              onHover={handleHover}
              onHoverEnd={handleHoverEnd}
              deleteMode={deleteMode}
              onPopLastChip={onPopLastChip}
              onClearZone={onClearZone}
              isMine={myBets ? myBets.has('split-0-00') : true}
            />
          )}
        </div>

        {/* NUMBERS GRID */}
        <div className="grid grid-rows-3 gap-0 relative border-t border-[#5ea896] bg-black/10">
          {GRID_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-12 gap-0">
              {row.map((num) => {
                const betId = `straight-${num}`;
                return (
                  <NumberCell
                    key={num}
                    num={num}
                    bet={bets.get(betId)}
                    onPlace={() => onPlaceBet(betId)}
                    onRemove={() => onRemoveBet(betId)}
                    disabled={disabled}
                    isWinner={isWinningNumber(num) || isBetWinner(betId)}
                    phase={phase}
                    style={{ borderWidth: '0 1px 1px 0' }}
                    isHovered={hoveredNumbers.includes(num)}
                    onNumberHover={handleNumberHover}
                    onNumberHoverEnd={handleNumberHoverEnd}
                    deleteMode={deleteMode}
                    onPopLastChip={onPopLastChip}
                    onClearZone={onClearZone}
                    isMine={myBets ? myBets.has(betId) : true}
                  />
                );
              })}
            </div>
          ))}

          {/* COMBINATION BETS OVERLAY */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Horizontal Splits */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33].map(n => {
              const betId = `split-${n}-${n + 3}`, col = Math.floor((n - 1) / 3), row = 2 - ((n - 1) % 3);
              return <DropZone key={betId} betId={betId} x={`${(col + 1) * (100 / 12)}%`} y={`${(row + 0.5) * (100 / 3)}%`} width="12px" height="20px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner(betId)} phase={phase} numbers={[n, n + 3]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has(betId) : true} />;
            })}
            {/* Vertical Splits */}
            {[1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 35].map(n => {
              const betId = `split-${n}-${n + 1}`, col = Math.floor((n - 1) / 3), row = 2 - ((n - 1) % 3);
              return <DropZone key={betId} betId={betId} x={`${(col + 0.5) * (100 / 12)}%`} y={`${(row) * (100 / 3)}%`} width="24px" height="12px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner(betId)} phase={phase} numbers={[n, n + 1]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has(betId) : true} />;
            })}
            {/* Corner Bets */}
            {[1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32].map(n => {
              const betId = `corner-${n}-${n + 1}-${n + 3}-${n + 4}`, col = Math.floor((n - 1) / 3), row = 2 - ((n - 1) % 3);
              return <DropZone key={betId} betId={betId} x={`${(col + 1) * (100 / 12)}%`} y={`${(row) * (100 / 3)}%`} width="14px" height="14px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner(betId)} phase={phase} numbers={[n, n + 1, n + 3, n + 4]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has(betId) : true} />;
            })}
            {/* Street Bets */}
            {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => {
              const betId = `street-${n}-${n + 1}-${n + 2}`, col = Math.floor((n - 1) / 3);
              return <DropZone key={betId} betId={betId} x={`${(col + 0.5) * (100 / 12)}%`} y="100%" width="24px" height="12px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner(betId)} phase={phase} numbers={[n, n + 1, n + 2]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has(betId) : true} />;
            })}
            {/* Sixline Bets */}
            {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31].map(n => {
              const betId = `sixline-${n}-${n + 5}`, col = Math.floor((n - 1) / 3);
              const nums = [n, n + 1, n + 2, n + 3, n + 4, n + 5];
              return <DropZone key={betId} betId={betId} x={`${(col + 1) * (100 / 12)}%`} y="100%" width="14px" height="14px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner(betId)} phase={phase} numbers={nums} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has(betId) : true} />;
            })}
            {/* Zero/First Row Splits */}
            <DropZone betId="split-0-1" x="0%" y="83.3%" width="20px" height="20px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('split-0-1')} phase={phase} numbers={[0, 1]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('split-0-1') : true} />
            <DropZone betId="split-0-2" x="0%" y={wheelType === 'american' ? '60.0%' : '50.0%'} width="20px" height="20px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('split-0-2')} phase={phase} numbers={[0, 2]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('split-0-2') : true} />
            {wheelType === 'american' ? (
              <>
                <DropZone betId="split-00-2" x="0%" y="40.0%" width="20px" height="20px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('split-00-2')} phase={phase} numbers={[37, 2]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('split-00-2') : true} />
                <DropZone betId="split-00-3" x="0%" y="16.6%" width="20px" height="20px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('split-00-3')} phase={phase} numbers={[37, 3]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('split-00-3') : true} />
              </>
            ) : (
              <DropZone betId="split-0-3" x="0%" y="16.6%" width="20px" height="20px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('split-0-3')} phase={phase} numbers={[0, 3]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('split-0-3') : true} />
            )}

            {/* Trio & Basket */}
            <DropZone betId="trio-0-1-2" x="0%" y="66.6%" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('trio-0-1-2')} phase={phase} numbers={[0, 1, 2]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('trio-0-1-2') : true} />
            {wheelType === 'american' ? (
              <DropZone betId="trio-0-2-3" x="0%" y="33.3%" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('trio-0-2-3')} phase={phase} numbers={[0, 2, 3]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('trio-0-2-3') : true} />
            ) : null}
            {wheelType === 'american' && (
              <DropZone betId="trio-00-2-3" x="0%" y="33.3%" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('trio-00-2-3')} phase={phase} numbers={[37, 2, 3]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('trio-00-2-3') : true} />
            )}
            {wheelType === 'american' && (
              <DropZone betId="basket-0-00-1-2-3" x="0%" y="50%" width="14px" height="44px" bets={bets} onPlace={onPlaceBet} onRemove={onRemoveBet} disabled={disabled} isWinner={isBetWinner('basket-0-00-1-2-3')} phase={phase} numbers={[0, 37, 1, 2, 3]} onHover={handleHover} onHoverEnd={handleHoverEnd} deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('basket-0-00-1-2-3') : true} />
            )}
          </div>
        </div>

        {/* COLUMNS BLOCK */}
        <div className="grid grid-rows-3 gap-0 border-t border-r border-[#5ea896] rounded-tr-lg overflow-hidden bg-black/10">
          {[
            { id: 'column-3rd', label: '2-1', nums: COLUMN_3RD },
            { id: 'column-2nd', label: '2-1', nums: COLUMN_2ND },
            { id: 'column-1st', label: '2-1', nums: COLUMN_1ST }
          ].map((item) => (
            <OutsideBetCell
              key={item.id}
              label={item.label}
              bet={bets.get(item.id)}
              onPlace={() => onPlaceBet(item.id)}
              onRemove={() => onRemoveBet(item.id)}
              disabled={disabled}
              isWinner={isBetWinner(item.id)}
              phase={phase}
              numbers={item.nums}
              onHover={handleHover}
              onHoverEnd={handleHoverEnd}
              betId={item.id}
              deleteMode={deleteMode}
              onPopLastChip={onPopLastChip}
              onClearZone={onClearZone}
              isMine={myBets ? myBets.has(item.id) : true}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: Dozens */}
      <div className="grid grid-cols-[32px_1fr_32px] sm:grid-cols-[48px_1fr_40px] md:grid-cols-[60px_1fr_48px] gap-0 w-full bg-black/10">
        <div className="border-l border-[#5ea896] bg-transparent" />
        <div className="grid grid-cols-3 gap-0 border-l border-[#5ea896]">
          <OutsideBetCell label="1st 12" bet={bets.get('dozen-1st')} onPlace={() => onPlaceBet('dozen-1st')} onRemove={() => onRemoveBet('dozen-1st')} disabled={disabled} isWinner={isBetWinner('dozen-1st')} phase={phase} numbers={DOZEN_1ST} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="dozen-1st" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('dozen-1st') : true} style={{ borderRight: '1px solid #5ea896', borderBottom: '1px solid #5ea896' }} />
          <OutsideBetCell label="2nd 12" bet={bets.get('dozen-2nd')} onPlace={() => onPlaceBet('dozen-2nd')} onRemove={() => onRemoveBet('dozen-2nd')} disabled={disabled} isWinner={isBetWinner('dozen-2nd')} phase={phase} numbers={DOZEN_2ND} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="dozen-2nd" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('dozen-2nd') : true} style={{ borderRight: '1px solid #5ea896', borderBottom: '1px solid #5ea896' }} />
          <OutsideBetCell label="3rd 12" bet={bets.get('dozen-3rd')} onPlace={() => onPlaceBet('dozen-3rd')} onRemove={() => onRemoveBet('dozen-3rd')} disabled={disabled} isWinner={isBetWinner('dozen-3rd')} phase={phase} numbers={DOZEN_3RD} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="dozen-3rd" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('dozen-3rd') : true} style={{ borderRight: '1px solid #5ea896', borderBottom: '1px solid #5ea896' }} />
        </div>
        <div className="border-r border-[#5ea896]" />
      </div>

      {/* SECTION 3: Even Chances */}
      <div className="grid grid-cols-[32px_1fr_32px] sm:grid-cols-[48px_1fr_40px] md:grid-cols-[60px_1fr_48px] gap-0 w-full rounded-b-lg overflow-hidden bg-black/10">
        <div className="border-l border-b border-[#5ea896]" />
        <div className="grid grid-cols-6 gap-0 border-l border-b border-[#5ea896]">
          <OutsideBetCell label="1-18" bet={bets.get('low')} onPlace={() => onPlaceBet('low')} onRemove={() => onRemoveBet('low')} disabled={disabled} isWinner={isBetWinner('low')} phase={phase} numbers={LOW_NUMBERS} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="low" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('low') : true} style={{ borderRight: '1px solid #5ea896' }} />
          <OutsideBetCell label="Even" bet={bets.get('even')} onPlace={() => onPlaceBet('even')} onRemove={() => onRemoveBet('even')} disabled={disabled} isWinner={isBetWinner('even')} phase={phase} numbers={EVEN_NUMBERS} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="even" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('even') : true} style={{ borderRight: '1px solid #5ea896' }} />
          <OutsideBetCell label={<div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#bd222e] shadow-lg" />} bet={bets.get('red')} onPlace={() => onPlaceBet('red')} onRemove={() => onRemoveBet('red')} disabled={disabled} isWinner={isBetWinner('red')} phase={phase} numbers={RED_NUMBERS} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="red" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('red') : true} style={{ borderRight: '1px solid #5ea896' }} />
          <OutsideBetCell label={<div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#1e1e1e] shadow-lg" />} bet={bets.get('black')} onPlace={() => onPlaceBet('black')} onRemove={() => onRemoveBet('black')} disabled={disabled} isWinner={isBetWinner('black')} phase={phase} numbers={BLACK_NUMBERS} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="black" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('black') : true} style={{ borderRight: '1px solid #5ea896' }} />
          <OutsideBetCell label="Odd" bet={bets.get('odd')} onPlace={() => onPlaceBet('odd')} onRemove={() => onRemoveBet('odd')} disabled={disabled} isWinner={isBetWinner('odd')} phase={phase} numbers={ODD_NUMBERS} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="odd" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('odd') : true} style={{ borderRight: '1px solid #5ea896' }} />
          <OutsideBetCell label="19-36" bet={bets.get('high')} onPlace={() => onPlaceBet('high')} onRemove={() => onRemoveBet('high')} disabled={disabled} isWinner={isBetWinner('high')} phase={phase} numbers={HIGH_NUMBERS} onHover={handleHover} onHoverEnd={handleHoverEnd} betId="high" deleteMode={deleteMode} onPopLastChip={onPopLastChip} onClearZone={onClearZone} isMine={myBets ? myBets.has('high') : true} style={{ borderRight: '1px solid #5ea896' }} />
        </div>
        <div className="border-r border-b border-[#5ea896]" />
      </div>

      {/* Hover Highlight Overlay */}
      {hoveredBetId && hoveredNumbers.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-[#c9a44c] px-3 py-1 rounded-full text-xs font-bold border border-[#c9a44c]/30 backdrop-blur-md z-[60] pointer-events-none">
          Targeting: {hoveredNumbers.length} numbers
        </div>
      )}
    </div>
  );
});

export default BettingLayout;
