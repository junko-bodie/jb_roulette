import React, { useRef, useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RouletteWheel from './RouletteWheel';
import BettingLayout from './BettingLayout';
import BettingControlButtons from '@/components/ui/BettingControlBar';
import { type WheelType, type SpinResult } from '@/lib/rng';
import { type PlacedBet } from '@/lib/bets';
import { type PayoutResult } from '@/lib/payouts';
import { soundEngine } from '@/lib/audioEngine';

import { useGame } from '@/context/GameContext';
import BetTimer from '@/components/ui/BetTimer';
import TournamentRules from '@/components/tournament/TournamentRules';

interface RouletteTableProps {
  wheelType: WheelType;
  currentResult: SpinResult | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
  wheelSize: number;
  wheelRef: React.RefObject<HTMLDivElement | null>;
  bets: Map<string, PlacedBet>;
  onPlaceBet: (betId: string) => void;
  onRemoveBet: (betId: string) => void;
  isBettingDisabled: boolean;
  lastPayout: PayoutResult | null;
  phase: string;
  setWheelType: (type: WheelType) => void;
  // Button action props
  onSpin: () => void;
  onRebet: () => void;
  onClearBets: () => void;
  onClearLastBet: () => void;
  hasLastSpin: boolean;
  // Advanced betting props
  balance?: number;
  totalBet?: number;
  onDoubleAllBets?: () => boolean;
  onToggleDeleteMode?: () => void;
  deleteMode?: boolean;
  onPopLastChip?: (betId: string) => void;
  onClearZone?: (betId: string) => void;
  onTimeout?: () => void;
  tournamentMode?: boolean;
  myBets?: Map<string, PlacedBet>;
}

const RouletteTable = memo(function RouletteTable({
  wheelType,
  currentResult,
  isSpinning,
  onSpinComplete,
  wheelSize,
  wheelRef,
  bets,
  onPlaceBet,
  onRemoveBet,
  isBettingDisabled,
  lastPayout,
  phase,
  setWheelType,
  onSpin,
  onRebet,
  onClearBets,
  onClearLastBet,
  hasLastSpin,
  balance = 0,
  totalBet = 0,
  onDoubleAllBets,
  onToggleDeleteMode,
  deleteMode = false,
  onPopLastChip,
  onClearZone,
  onTimeout,
  tournamentMode = false,
  myBets,
}: RouletteTableProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { isSoundEnabled, isTimerEnabled } = useGame();

  const handleSpinClick = () => {
    if (soundEngine) soundEngine.playSpinClick();
    onSpin();
  };

  const handleClearBetsClick = () => {
    if (soundEngine) soundEngine.playSwoosh();
    onClearBets();
  };

  const handleClearLastBetClick = () => {
    if (soundEngine) soundEngine.playSwoosh();
    onClearLastBet();
  };

  const handlePopLastChip = (betId: string) => {
    if (soundEngine) soundEngine.playSwoosh();
    onPopLastChip?.(betId);
  };

  const handleClearZone = (betId: string) => {
    if (soundEngine) soundEngine.playSwoosh();
    onClearZone?.(betId);
  };

  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const canBet = !isSpinning && phase === 'BETTING';
  const isLocked = phase === 'LOCKED';
  const hasBets = bets.size > 0;
  const spinEnabled = canBet && hasBets;

  return (
    <div className="mx-auto w-full max-w-[1500px] h-full flex flex-col">
      {/* THE FOAM BUFFER — Unified for both wheel and table */}
      <div
        className="relative p-0.5 sm:p-3 md:p-5 lg:p-6 rounded-[20px] sm:rounded-[35px] md:rounded-[50px] shadow-[0_40px_100px_rgba(0,0,0,1)] w-full flex-1 md:h-full overflow-visible md:overflow-hidden"
        style={{
          background: '#0a0a0a',
          border: isMobile ? '3px solid #050505' : '8px solid #050505',
          boxShadow: `
            inset 0 2px 5px rgba(255,255,255,0.05),
            inset 0 -10px 20px rgba(0,0,0,0.8),
            0 30px 60px rgba(0,0,0,1)
          `,
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Brushed Gold Inner Frame */}
        <div
          className="absolute rounded-[16px] sm:rounded-[28px] md:rounded-[38px] border-[1.5px] sm:border-[2px] md:border-[3px] border-[#c9a44c]/30 pointer-events-none"
          style={{
            inset: isMobile ? '2px' : '14px',
            zIndex: 1,
            boxShadow: 'inset 0 0 15px rgba(201, 164, 76, 0.2), 0 0 10px rgba(0,0,0,0.5)'
          }}
        />

        {/* The green felt area — VIP Emerald Edition */}
        <div
          className="relative rounded-[14px] sm:rounded-[24px] md:rounded-[32px] border-b-4 border-black/40 flex flex-row items-center justify-start sm:justify-center gap-3 md:gap-4 lg:gap-6 mobile-felt-stack h-full md:h-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #143d30 0%, #081a15 100%)',
            padding: isMobile ? '0rem 0rem 0.1rem 0rem' : '0.02rem 1.8rem 1.2rem 0.8rem',
            zIndex: 2,
            boxShadow: `
              inset 0 0 80px rgba(0,0,0,0.8),
              inset 0 10px 30px rgba(0,0,0,0.5)
            `,
            flex: 1
          }}
        >
          {/* Wheel Section (Left) */}
          <motion.div
            ref={wheelRef}
            className={`relative flex ${tournamentMode ? 'flex-col justify-center' : 'justify-center'} items-center mobile-wheel-section`}
            initial={{ opacity: 0, scale: 0.95, flex: 1 }}
            animate={isMobile
              ? {
                  opacity: 1,
                  scale: isSpinning ? (tournamentMode ? 1.05 : 1.2) : 1,
                  y: 0,
                  flex: 'none',
                }
              : {
                opacity: 1,
                scale: isSpinning ? (tournamentMode ? 1.05 : 1.2) : 1,
                y: isSpinning ? 0 : (tournamentMode ? 8 : -25),
                flex: 1 // Take full width when table is hidden
              }
            }

            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {tournamentMode && !isMobile && (
              <AnimatePresence>
                {!isSpinning && (
                  <motion.div
                    className="flex flex-col items-center mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <h1
                      className="text-2xl md:text-3xl tracking-wider"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontStyle: 'italic',
                        fontWeight: 900,
                        letterSpacing: '0.15em',
                        background: 'linear-gradient(180deg, #f5edd5, #c9a44c)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'inline-block',
                      }}
                    >
                      JUNKO BODIE
                    </h1>
                    <div className="flex items-center gap-2 -mt-0.5 mb-2">
                      <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                      <span
                        className="text-[9px] uppercase tracking-[0.4em]"
                        style={{
                          color: 'rgba(201, 164, 76, 0.5)',
                          fontFamily: "'Georgia', serif",
                          fontWeight: 700,
                        }}
                      >
                        Roulette
                      </span>
                      <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                    </div>
                    <TournamentRules />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            <RouletteWheel
              wheelType={wheelType}
              spinResult={currentResult}
              isSpinning={isSpinning}
              onSpinComplete={onSpinComplete}
              size={wheelSize}
            />

            {/* Wheel type toggle — overlaid at bottom center of wheel */}
            {!tournamentMode && (
              <div
                className="absolute flex items-center gap-1 sm:gap-2 z-30"
                style={{
                  fontFamily: 'var(--font-inter)',
                  bottom: isMobile ? '8px' : '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: '9999px',
                  padding: isMobile ? '3px 6px' : '5px 10px',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(201, 164, 76, 0.4)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                  opacity: isBettingDisabled ? 0.5 : 1,
                  pointerEvents: isBettingDisabled ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease',
                  fontSize: isMobile ? '10px' : '13px',
                }}
              >
                <button
                  onClick={() => setWheelType('american')}
                  className="rounded-full transition-all duration-300 cursor-pointer flex-1 text-center"
                  style={{
                    padding: isMobile ? '5px 12px' : '10px 32px',
                    background: wheelType === 'american'
                      ? 'linear-gradient(180deg, #c9a44c 0%, #a68434 100%)'
                      : 'rgba(255,255,255,0.15)',
                    color: wheelType === 'american' ? '#000' : 'rgba(245, 237, 213, 0.85)',
                    fontWeight: 900,
                    fontSize: isMobile ? '9px' : '14px',
                    letterSpacing: '0.05em',
                    border: '2px solid',
                    borderColor: wheelType === 'american' ? '#f5edd5' : 'transparent',
                    boxShadow: wheelType === 'american'
                      ? '0 0 20px rgba(201, 164, 76, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                      : 'none',
                    textTransform: 'uppercase'
                  }}
                >
                  American
                </button>
                <button
                  onClick={() => setWheelType('european')}
                  className="rounded-full transition-all duration-300 cursor-pointer flex-1 text-center"
                  style={{
                    padding: isMobile ? '5px 12px' : '10px 32px',
                    background: wheelType === 'european'
                      ? 'linear-gradient(180deg, #c9a44c 0%, #a68434 100%)'
                      : 'rgba(255,255,255,0.15)',
                    color: wheelType === 'european' ? '#000' : 'rgba(245, 237, 213, 0.85)',
                    fontWeight: 900,
                    fontSize: isMobile ? '9px' : '14px',
                    letterSpacing: '0.05em',
                    border: '2px solid',
                    borderColor: wheelType === 'european' ? '#f5edd5' : 'transparent',
                    boxShadow: wheelType === 'european'
                      ? '0 0 20px rgba(201, 164, 76, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                      : 'none',
                    textTransform: 'uppercase'
                  }}
                >
                  European
                </button>
              </div>
            )}
          </motion.div>

          <motion.div
            className={`flex flex-col items-center justify-start p-0.5 sm:p-2 mobile-table-section w-full min-w-0 ${tournamentMode && !isMobile ? '-mt-20' : ''}`}
            initial={{ opacity: 0, x: 20, scale: 0.95, flex: 2 }}
            animate={isMobile
              ? {
                  opacity: isSpinning ? 0 : 1,
                  scale: isSpinning ? 0.9 : 1,
                  y: 0,
                  flex: (isLandscape && tournamentMode) ? 1 : 'none',
                }
              : {
                opacity: isSpinning ? 0 : 1, // Completely hide during spin
                pointerEvents: isSpinning ? 'none' : 'auto',
                x: 1,
                scaleX: isSpinning ? 0.9 : 1.119,
                scaleY: isSpinning ? 0.9 : (tournamentMode ? 2.1 : 1.7),
                flex: isSpinning ? 0 : (tournamentMode ? 2.3 : 2) // Remove from layout during spin
              }
            }
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >



            {/* Junko Bodie Title & Tournament Rules */}
            {!tournamentMode ? (
              <div
                className={isMobile
                  ? "flex flex-row items-center gap-3 mb-0.5 relative"
                  : "hidden lg:flex flex-col items-center mb-0.5 -mt-24 relative"
                }
                style={isMobile ? {} : { transform: 'scaleX(0.977) scaleY(0.69)' }}
              >
                {/* Title + subtitle group */}
                <div className="flex flex-col items-center">
                  <h1
                    className={isMobile ? "text-sm tracking-wider" : "text-2xl md:text-3xl tracking-wider"}
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontStyle: 'italic',
                      fontWeight: 900,
                      letterSpacing: '0.15em',
                      background: 'linear-gradient(180deg, #f5edd5, #c9a44c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      display: 'inline-block',
                      filter: isSpinning ? 'drop-shadow(0 0 12px rgba(201, 164, 76, 0.4))' : 'none',
                      transition: 'filter 0.5s ease',
                    }}
                  >
                    JUNKO BODIE
                  </h1>

                  <div className="flex items-center gap-2 -mt-0.5">
                    <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                    <span
                      className="text-[9px] uppercase tracking-[0.4em]"
                      style={{
                        color: 'rgba(201, 164, 76, 0.5)',
                        fontFamily: "'Georgia', serif",
                        fontWeight: 700,
                      }}
                    >
                      Roulette
                    </span>
                    <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                  </div>
                </div>

                {/* Timer Section — desktop: absolute right of title; mobile: inline right */}
                {isTimerEnabled && !isSpinning && phase === 'BETTING' && (
                  isMobile ? (
                    <div>
                      <BetTimer
                        duration={45}
                        isActive={phase === 'BETTING' && !isSpinning}
                        onTimeout={() => {
                          if (onTimeout) {
                            onTimeout();
                          } else if (!isSpinning) {
                            handleSpinClick();
                          }
                        }}
                        variant="default"
                      />
                    </div>
                  ) : (
                    <div
                      className="absolute left-[calc(100%+60px)] top-1/2 -translate-y-1/2"
                      style={{ transform: 'scaleX(1.136) scaleY(0.75)' }}
                    >
                      <BetTimer
                        duration={45}
                        isActive={phase === 'BETTING' && !isSpinning}
                        onTimeout={() => {
                          if (onTimeout) {
                            onTimeout();
                          } else if (!isSpinning) {
                            handleSpinClick();
                          }
                        }}
                        variant="large"
                      />
                    </div>
                  )
                )}
              </div>
            ) : (
              /* Tournament mode: show title only on mobile */
              isMobile ? (
                <div className="flex flex-row items-center gap-3 mb-0.5 relative">
                  <div className="flex flex-col items-center">
                    <h1
                      className="text-sm tracking-wider"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontStyle: 'italic',
                        fontWeight: 900,
                        letterSpacing: '0.15em',
                        background: 'linear-gradient(180deg, #f5edd5, #c9a44c)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'inline-block',
                      }}
                    >
                      JUNKO BODIE
                    </h1>
                    <div className="flex items-center gap-2 -mt-0.5">
                      <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                      <span
                        className="text-[9px] uppercase tracking-[0.4em]"
                        style={{
                          color: 'rgba(201, 164, 76, 0.5)',
                          fontFamily: "'Georgia', serif",
                          fontWeight: 700,
                        }}
                      >
                        Roulette
                      </span>
                      <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" style={{ opacity: 0.3 }} />
                    </div>
                  </div>
                </div>
              ) : null
            )}

            {/* Betting Grid Section with Blur & Overlay */}
            <div className="w-full relative" style={isMobile && tournamentMode ? {
              zoom: 0.78,
            } : {}}>
              <div
                className="transition-all duration-700 w-full"
                style={{ 
                  filter: isLocked || isSpinning ? 'blur(4px)' : 'none', // Reduced blur for better aesthetics
                  opacity: isSpinning ? 0.4 : 1 // Subtly fade the grid itself
                }}
              >
                <BettingLayout

                  bets={bets}
                  onPlaceBet={onPlaceBet}
                  onRemoveBet={onRemoveBet}
                  disabled={isBettingDisabled || isLocked}
                  winningResult={currentResult}
                  payoutResult={lastPayout}
                  showWinHighlight={!!currentResult && !isSpinning}
                  phase={phase}
                  deleteMode={deleteMode}
                  onPopLastChip={handlePopLastChip}
                  onClearZone={handleClearZone}
                  wheelType={wheelType}
                  myBets={myBets}
                  isCompact={tournamentMode}
                />
              </div>

              {/* BETS CLOSED Overlay */}
              <AnimatePresence>
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                  >
                    <div
                      className="px-8 py-4 rounded-xl border-4 border-[#c9a44c] bg-black/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2"
                      style={{ transform: 'rotate(-5deg)' }}
                    >
                      <span className="text-4xl font-black text-white tracking-[0.2em] italic" style={{ fontFamily: "'Georgia', serif" }}>
                        BETS CLOSED
                      </span>
                      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
                      <span className="text-[10px] text-[#c9a44c] uppercase tracking-[0.4em] font-bold">Good Luck</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ═══ BUTTONS — directly below betting grid (hidden in tournament mode) ═══ */}
            {!tournamentMode && (
              <div
                className={`flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-1 sm:gap-4 lg:gap-8 mt-1 sm:mt-2 lg:mt-56 mb-1 sm:mb-2 lg:mb-12 w-full px-1 sm:pr-12`}
                style={{ transform: 'scaleX(1.0) scaleY(1.0)' }}
              >


                {/* 2X and Delete Mode Buttons — Left Side */}
                {!isBettingDisabled && totalBet > 0 && (
                  <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4 mr-1 sm:mr-2">
                    <BettingControlButtons
                      totalBet={totalBet}
                      balance={balance}
                      onDouble={onDoubleAllBets || (() => false)}
                      onToggleDelete={onToggleDeleteMode || (() => { })}
                      deleteMode={deleteMode}
                      disabled={isBettingDisabled}
                    />
                    <div style={{ width: '1px', height: '24px', background: '#5ea896', opacity: 0.3 }} />
                  </div>
                )}

                <button
                  onClick={onRebet}
                  disabled={!canBet || !hasLastSpin}
                  className="flex-shrink-0 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 hover:text-white"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: isMobile ? '13px' : '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: (!canBet || !hasLastSpin) ? 'rgba(228, 224, 212, 0.25)' : '#e4e0d4',
                    background: 'linear-gradient(180deg, #3d5443 0%, #2a2a2a 100%)',
                    borderWidth: isMobile ? '2.5px' : '3px',
                    borderStyle: 'solid',
                    borderColor: (!canBet || !hasLastSpin) ? 'rgba(201, 164, 76, 0.2)' : '#c9a44c',
                    borderRadius: '10px',
                    padding: isMobile ? '7px 9px' : '8px 16px',
                    lineHeight: 1,
                    boxShadow: (!canBet || !hasLastSpin) ? 'none' : '0 4px 0 #1a0f09, 0 8px 15px rgba(0,0,0,0.5)',
                  }}
                >
                  REBET
                </button>

                <button
                  onClick={handleClearBetsClick}
                  disabled={!canBet || !hasBets}
                  className="flex-shrink-0 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 hover:text-white"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: isMobile ? '13px' : '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: (!canBet || !hasBets) ? 'rgba(228, 224, 212, 0.25)' : '#e4e0d4',
                    background: 'linear-gradient(180deg, #3d5443 0%, #2a2a2a 100%)',
                    borderWidth: isMobile ? '2.5px' : '3px',
                    borderStyle: 'solid',
                    borderColor: (!canBet || !hasBets) ? 'rgba(201, 164, 76, 0.2)' : '#c9a44c',
                    borderRadius: '10px',
                    padding: isMobile ? '7px 9px' : '8px 16px',
                    lineHeight: 1,
                    boxShadow: (!canBet || !hasBets) ? 'none' : '0 4px 0 #1a0f09, 0 8px 15px rgba(0,0,0,0.5)',
                  }}
                >
                  Clear
                </button>

                <button
                  onClick={handleClearLastBetClick}
                  disabled={!canBet || !hasBets}
                  className="flex-shrink-0 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 hover:text-white"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: isMobile ? '13px' : '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color: (!canBet || !hasBets) ? 'rgba(228, 224, 212, 0.25)' : '#e4e0d4',
                    background: 'linear-gradient(180deg, #3d5443 0%, #2a2a2a 100%)',
                    borderWidth: isMobile ? '2.5px' : '3px',
                    borderStyle: 'solid',
                    borderColor: (!canBet || !hasBets) ? 'rgba(201, 164, 76, 0.2)' : '#c9a44c',
                    borderRadius: '10px',
                    padding: isMobile ? '7px 9px' : '8px 16px',
                    lineHeight: 1,
                    boxShadow: (!canBet || !hasBets) ? 'none' : '0 4px 0 #1a0f09, 0 8px 15px rgba(0,0,0,0.5)',
                  }}
                >
                  UNDO
                </button>

                {/* SPIN — dark green oval with thick gold 3D border */}
                <motion.button
                  onClick={handleSpinClick}
                  disabled={!spinEnabled}
                  whileHover={spinEnabled ? { scale: 1.05, y: -2 } : {}}
                  whileTap={spinEnabled ? {
                    scale: 0.98,
                    y: 4,
                    boxShadow: `0 2px 0 0 #1a0f09, 0 4px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)`
                  } : {}}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="relative overflow-hidden flex-shrink-0 cursor-pointer disabled:cursor-not-allowed ml-1 sm:ml-4"
                  style={{
                    background: isSpinning
                      ? 'linear-gradient(180deg, #0a1f1a 0%, #050f0d 100%)'
                      : spinEnabled
                        ? 'linear-gradient(180deg, #2a7d51 0%, #1a5c3d 40%, #0f3d28 100%)'
                        : 'linear-gradient(180deg, #333 0%, #222 100%)',
                    color: isSpinning ? '#c9a44c' : spinEnabled ? '#ffffff' : '#444',
                    fontFamily: "'Georgia', serif",
                    fontStyle: 'italic',
                    fontWeight: 900,
                    fontSize: isMobile ? '0.95rem' : '0.9rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    padding: isMobile ? '7px 16px' : '10px 32px',
                    borderRadius: '999px',
                    borderWidth: isSpinning || spinEnabled ? '3px' : '2px',
                    borderStyle: 'solid',
                    borderColor: isSpinning ? '#c9a44c' : spinEnabled ? '#f5edd5' : '#333',
                    boxShadow: spinEnabled
                      ? `0 8px 0 0 #1a0f09, 0 12px 25px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -5px 0 rgba(0,0,0,0.3), 0 0 40px rgba(201, 168, 76, 0.3)`
                      : isSpinning
                        ? '0 0 20px rgba(201, 164, 76, 0.2)'
                        : 'none',
                    textShadow: spinEnabled ? '0 2px 4px rgba(0,0,0,0.6)' : 'none',
                    marginTop: '11px',
                    opacity: isSpinning ? 0.9 : 1,
                  } as React.CSSProperties}
                >
                  {/* Shimmer overlay */}
                  {spinEnabled && !isSpinning && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)',
                        backgroundSize: '200% 100%',
                        borderRadius: '9999px',
                      } as React.CSSProperties}
                      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                    />
                  )}
                  {/* Pulse effect for spinning */}
                  {isSpinning && (
                    <motion.div
                      className="absolute inset-0 bg-[#c9a44c]/5"
                      animate={{ opacity: [0, 0.15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <span className="relative z-10">
                    {isSpinning ? 'SPINNING...' : 'SPIN'}
                  </span>
                </motion.button>

              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
});

export default RouletteTable;