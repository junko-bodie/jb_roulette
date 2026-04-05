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
import ChipStack from '@/components/chips/ChipStack';
import { getNumberColor, getDisplayNumber } from '@/lib/rng';
import { type SpinResult } from '@/lib/rng';
import { type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';
import { type PlacedBet } from '@/lib/bets';

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
  return <ChipStack chips={bet.chips} phase={phase} />;
}

/** Single number cell */
function NumberCell({
  num,
  bet,
  onPlace,
  onRemove,
  disabled,
  isWinner,
  phase,
}: {
  num: number;
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
      className="relative flex items-center justify-center cursor-pointer select-none text-[11px] sm:text-[13px] md:text-sm min-h-[18px] sm:min-h-[26px] md:min-h-[34px] group"
      style={{
        background: getCellBg(num),
        border: '1px solid #5ea896',
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
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
      {bet && (
        <>
          <ChipIndicator bet={bet} phase={phase} />
          {/* Tooltip */}
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-1 bg-black/90 text-[#c9a44c] text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-[#c9a44c]/40 backdrop-blur-sm whitespace-nowrap z-50 pointer-events-none">
            ${bet.amount.toLocaleString()}
          </div>
        </>
      )}
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
        className="w-full h-full rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none group">
          <ChipIndicator bet={bet} phase={phase} />
          {/* Tooltip */}
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/90 text-[#c9a44c] text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-[#c9a44c]/40 backdrop-blur-sm whitespace-nowrap z-50">
            ${bet.amount.toLocaleString()}
          </div>
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
  usePremiumFont,
}: {
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
  usePremiumFont?: boolean;
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
      className={`relative flex items-center justify-center cursor-pointer select-none text-[7px] sm:text-[9px] md:text-xs min-h-[24px] sm:min-h-[32px] md:min-h-[36px] group ${className}`}
      style={{
        background: isRed === true ? COLORS.rouletteRed : isRed === false ? '#1e1e1e' : 'transparent',
        border: '1px solid #5ea896',
        fontFamily: usePremiumFont ? "'Playfair Display', serif" : 'var(--font-inter)',
        fontWeight: usePremiumFont ? 700 : 600,
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
      {bet && (
        <>
          <ChipIndicator bet={bet} phase={phase} />
          {/* Tooltip */}
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-1 bg-black/90 text-[#c9a44c] text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-[#c9a44c]/40 backdrop-blur-sm whitespace-nowrap z-50 pointer-events-none">
            ${bet.amount.toLocaleString()}
          </div>
        </>
      )}
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
    <div className="flex flex-col items-center w-full mx-auto">
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
              bet={bets.get('straight-0')}
              onPlace={() => onPlaceBet('straight-0')}
              onRemove={() => onRemoveBet('straight-0')}
              disabled={disabled}
              isWinner={isWinningNumber(0) || isBetWinner('straight-0')}
              phase={phase}
            />
            <NumberCell
              num={37}
              bet={bets.get('straight-00')}
              onPlace={() => onPlaceBet('straight-00')}
              onRemove={() => onRemoveBet('straight-00')}
              disabled={disabled}
              isWinner={isWinningNumber(37) || isBetWinner('straight-00')}
              phase={phase}
            />
            
            {/* Split 0-00 target — Restored for Week 1 sign-off */}
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

            {/* COMBINATION BETS OVERLAY (Splits, Corners, Streets) — Restored for Week 1 sign-off */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Horizontal Splits (adjacent columns) */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33].map(n => {
                const betId = `split-${n}-${n + 3}`;
                const col = Math.floor((n - 1) / 3);
                const row = 2 - ((n - 1) % 3);
                const left = `${(col + 1) * (100/12)}%`;
                const top = `${(row + 0.5) * (100/3)}%`;
                
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={left}
                    y={top}
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
              })}

              {/* Vertical Splits (adjacent rows) */}
              {[1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 35].map(n => {
                const betId = `split-${n}-${n + 1}`;
                const col = Math.floor((n - 1) / 3);
                const row = 2 - ((n - 1) % 3);
                const left = `${(col + 0.5) * (100/12)}%`;
                const top = `${(row) * (100/3)}%`;
                
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={left}
                    y={top}
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

              {/* Corner Bets (4 numbers) */}
              {[1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32].map(n => {
                const betId = `corner-${n}-${n+1}-${n+3}-${n+4}`;
                const col = Math.floor((n - 1) / 3);
                const row = 2 - ((n - 1) % 3);
                const left = `${(col + 1) * (100/12)}%`;
                const top = `${(row) * (100/3)}%`;
                
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={left}
                    y={top}
                    width="14px"
                    height="14px"
                    bets={bets}
                    onPlace={onPlaceBet}
                    onRemove={onRemoveBet}
                    disabled={disabled}
                    isWinner={isBetWinner(betId)}
                    phase={phase}
                  />
                );
              })}

              {/* Street Bets (Row of 3) */}
              {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => {
                const betId = `street-${n}-${n+1}-${n+2}`;
                const col = Math.floor((n - 1) / 3);
                const left = `${(col + 0.5) * (100/12)}%`;
                const top = `100%`; // Target bottom of the column
                
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={left}
                    y={top}
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

              {/* Sixline Bets (2 adjacent columns) */}
              {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31].map(n => {
                const betId = `sixline-${n}-${n+5}`;
                const col = Math.floor((n - 1) / 3);
                const left = `${(col + 1) * (100/12)}%`;
                const top = `100%`;
                
                return (
                  <DropZone
                    key={betId}
                    betId={betId}
                    x={left}
                    y={top}
                    width="14px"
                    height="14px"
                    bets={bets}
                    onPlace={onPlaceBet}
                    onRemove={onRemoveBet}
                    disabled={disabled}
                    isWinner={isBetWinner(betId)}
                    phase={phase}
                  />
                );
              })}

              {/* Trio Bets (0-1-2, 0-2-3, 00-2-3) */}
              <DropZone
                betId="trio-0-1-2"
                x="0%"
                y="66.6%"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('trio-0-1-2')}
                phase={phase}
              />
              <DropZone
                betId="trio-0-2-3"
                x="0%"
                y="33.3%"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('trio-0-2-3')}
                phase={phase}
              />
              <DropZone
                betId="trio-00-2-3"
                x="0%"
                y="33.3%"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('trio-00-2-3')}
                phase={phase}
              />

              {/* Basket / Top Line (0-00-1-2-3) */}
              <DropZone
                betId="basket-0-00-1-2-3"
                x="0%"
                y="50%"
                width="14px"
                height="44px"
                bets={bets}
                onPlace={onPlaceBet}
                onRemove={onRemoveBet}
                disabled={disabled}
                isWinner={isBetWinner('basket-0-00-1-2-3')}
                phase={phase}
              />
            </div>
          </div>
        </div>

        {/* Dozens row */}
        <div className="grid grid-cols-[32px_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr] md:grid-cols-[60px_1fr_1fr_1fr] gap-0">
          <div />
          {[
            { id: 'dozen-1st', label: '1st 12' },
            { id: 'dozen-2nd', label: '2nd 12' },
            { id: 'dozen-3rd', label: '3rd 12' },
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
              usePremiumFont={true}
            />
          ))}
        </div>

        {/* Even-money bets row */}
        <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr_1fr_1fr_1fr] md:grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr] gap-0">
          <div />
          <OutsideBetCell
            label="1-18"
            bet={bets.get('low')}
            onPlace={() => onPlaceBet('low')}
            onRemove={() => onRemoveBet('low')}
            disabled={disabled}
            isWinner={isBetWinner('low')}
            phase={phase}
          />
          <OutsideBetCell
            label="Even"
            bet={bets.get('even')}
            onPlace={() => onPlaceBet('even')}
            onRemove={() => onRemoveBet('even')}
            disabled={disabled}
            isWinner={isBetWinner('even')}
            phase={phase}
          />
          <OutsideBetCell
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
            label="Odd"
            bet={bets.get('odd')}
            onPlace={() => onPlaceBet('odd')}
            onRemove={() => onRemoveBet('odd')}
            disabled={disabled}
            isWinner={isBetWinner('odd')}
            phase={phase}
          />
          <OutsideBetCell
            label="19-36"
            bet={bets.get('high')}
            onPlace={() => onPlaceBet('high')}
            onRemove={() => onRemoveBet('high')}
            disabled={disabled}
            isWinner={isBetWinner('high')}
            phase={phase}
          />
        </div>

      </div>
    </div>
  );
}
