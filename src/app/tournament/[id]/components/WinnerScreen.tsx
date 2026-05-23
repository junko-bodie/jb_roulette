'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowLeft,
  Users,
  Clock,
  CircleDollarSign,
  Medal,
  Skull,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Star,
  Crown,
  Globe
} from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';
import Avatar from '@/components/ui/Avatar';

interface WinnerScreenProps {
  tournament: any;
  player: {
    username: string;
    is_bot: boolean;
    final_chips: number;
    final_position: number;
    eliminated_round: number;
  };
  isCompleted?: boolean;
}

export default function WinnerScreen({ tournament, player, isCompleted = true }: WinnerScreenProps) {
  const isWinner = player.final_position === 1;

  useEffect(() => {
    if (isWinner) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          colors: ['#C9A84C', '#1a5c35', '#fff', '#e8d5a0'],
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          colors: ['#C9A84C', '#1a5c35', '#fff', '#e8d5a0'],
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isWinner]);

  const standings = useMemo(() => {
    return [...tournament.players].map(p => ({
      ...p,
      current_chips: Math.max(0, p.current_chips || 0),
      final_chips: Math.max(0, p.final_chips || 0)
    })).sort((a, b) => {
      const posA = a.final_position || (a.status === 'active' ? 0 : 7);
      const posB = b.final_position || (b.status === 'active' ? 0 : 7);

      if (posA !== posB) return posA - posB;

      // Tie-break for active players by chips
      return b.current_chips - a.current_chips;
    });
  }, [tournament]);

  const pointsEarned = useMemo(() => {
    const p = tournament.players.find((p: any) => p.player_id.toString() === (player as any).player_id?.toString() || p.username === player.username);
    return p?.points_earned ?? 0;
  }, [tournament, player]);

  const durationStr = useMemo(() => {
    if (!tournament.created_at || !tournament.completed_at) return '0h 42m';
    const start = new Date(tournament.created_at).getTime();
    const end = new Date(tournament.completed_at).getTime();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [tournament]);

  const realPlayer = tournament.players.find((p: any) => !p.is_bot);
  const rankColors: Record<number, string> = { 1: '#B8960C', 2: '#7A7A8A', 3: '#8B5E3C' };

  const positionLabel = (pos: number) => {
    if (pos === 1) return '1st Place';
    if (pos === 2) return '2nd Place';
    if (pos === 3) return '3rd Place';
    return `${pos}th Place`;
  };

  return (
    <div
      className="fixed inset-0 z-[250] overflow-y-auto flex flex-col bg-[#f5eedc]"
      style={{
        fontFamily: FONTS.primary,
      }}
    >
      {/* Background Layers */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `linear-gradient(160deg, #f5eedc 0%, #e8d8b0 40%, #dbcb9e 100%)`,
        zIndex: 0
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(26,92,53,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.08) 0%, transparent 50%)`,
        zIndex: 0
      }} />

      {/* ── GREEN HEADER BAR ── */}
      <header
        className="relative z-[260] flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: '#0f2318',
          height: '60px',
          padding: '0 28px',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/lobby"
            className="flex items-center justify-center transition-all hover:opacity-80"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(201,164,76,0.1)',
              border: '1px solid rgba(201,164,76,0.3)',
              color: '#c9a44c',
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span style={{
              color: '#f2e8d0',
              fontFamily: "'Arial Narrow', Arial, sans-serif",
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Junko Bodie Roulette
            </span>
            <span style={{ color: '#c9a44c', fontSize: '13px', opacity: 0.5 }}>|</span>
            <span style={{
              color: '#c9a44c',
              fontFamily: "'Arial Narrow', Arial, sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              opacity: 0.85,
            }}>
              Pro Tournament Series
            </span>
          </div>
        </div>
        <Link
          href="/lobby"
          className="group flex items-center gap-2 transition-all active:scale-[0.97]"
          style={{
            padding: '10px 24px',
            borderRadius: '14px',
            background: '#1a5c35',
            boxShadow: '0 4px 0 #0f3d22, 0 8px 20px rgba(26,92,53,0.3)',
          }}
        >
          <ArrowLeft
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            style={{ color: '#f5e9b8' }}
          />
          <span style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#f5e9b8',
          }}>
            Exit Tournament
          </span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="relative w-full flex flex-col items-center py-2 px-6 flex-1 overflow-y-auto" style={{ zIndex: 1 }}>
        <div className="w-full max-w-5xl flex flex-col items-center gap-3">

          {/* ── HEADER SECTION ── */}
          {/* Main Heading + Status Badge */}
          <div className="relative flex justify-center items-center w-full">
            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              style={{
                position: 'relative',
                fontFamily: "'Georgia', serif",
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 700,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#0d2a20',
                textShadow: '0 1px 0 rgba(201,168,76,0.1)',
                margin: 0,
                whiteSpace: 'nowrap'
              }}
            >
              {isWinner ? 'Champion!' : isCompleted ? 'Tournament Results' : 'Personal Summary'}

              {/* Desktop badge - positioned to the right */}
              {!isCompleted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-[100%] top-1/2 -translate-y-1/2 ml-8 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hidden md:flex items-center justify-center"
                  style={{ fontStyle: 'normal' }}
                >
                  <span className="text-[10px] leading-normal font-black uppercase tracking-[0.3em] text-amber-700 whitespace-nowrap pt-[2px]">
                    Tournament Still In Progress
                  </span>
                </motion.div>
              )}
            </motion.h1>
          </div>

          {/* Mobile badge - positioned below heading */}
          {!isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 md:hidden mt-1 flex items-center justify-center"
            >
              <span className="text-[20px] leading-normal font-black uppercase tracking-[0.3em] text-amber-700 whitespace-nowrap pt-[2px]">
                Tournament Still In Progress
              </span>
            </motion.div>
          )}

          {/* Hero emblem */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex flex-col items-center mb-4 mt-1"
          >
            <div
              className="relative z-20"
              style={{ width: 'auto', minWidth: '320px', maxWidth: '480px' }}
            >
              <div
                className="relative flex flex-col items-center justify-center"
                style={{
                  paddingTop: '12px',
                  paddingBottom: '10px',
                  paddingLeft: '40px',
                  paddingRight: '40px',
                  background: 'linear-gradient(135deg, #1a4d28 0%, #1a5c35 50%, #1a4d28 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                  borderTop: '2px solid rgba(201,168,76,0.5)',
                  borderBottom: '2px solid rgba(201,168,76,0.5)',
                  whiteSpace: 'nowrap',
                }}
              >
                {/* Left ribbon tail */}
                <div className="absolute -left-4 top-1 bottom-1 w-4" style={{
                  background: '#143d20',
                  clipPath: 'polygon(100% 0, 100% 100%, 0 50%)',
                }} />
                {/* Right ribbon tail */}
                <div className="absolute -right-4 top-1 bottom-1 w-4" style={{
                  background: '#143d20',
                  clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
                }} />

                <span style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#f5e9b8',
                  letterSpacing: '0.04em',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                }}>
                  {player.username}
                </span>
                <span style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#C9A84C',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                }}>
                  {positionLabel(player.final_position)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── SUMMARY CARDS ── */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {/* Final Chips */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-1.5 p-3"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(26,42,26,0.5)',
              }}>
                Your Chips
              </span>
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 flex-shrink-0" style={{ color: '#B8960C' }} />
                <span style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#1a3024',
                  whiteSpace: 'nowrap',
                }}>
                  ${Math.max(0, player.final_chips).toLocaleString()}
                </span>
              </div>
            </motion.div>

            {/* Championship Points */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col items-center gap-1 p-3"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(26,42,26,0.5)',
              }}>
                Points Earned
              </span>
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: pointsEarned >= 0 ? '#1a5c35' : '#b83232',
                }}>
                  {pointsEarned >= 0 ? `+${pointsEarned}` : pointsEarned}
                </span>
                <TrendingUp
                  className={`w-5 h-5 flex-shrink-0 ${pointsEarned < 0 ? 'rotate-180' : ''}`}
                  style={{ color: pointsEarned >= 0 ? '#1a5c35' : '#b83232' }}
                />
              </div>
            </motion.div>

            {/* World Ranking */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-1.5 p-3"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(26,42,26,0.5)',
              }}>
                World Ranking
              </span>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(26,42,26,0.35)' }} />
                <span style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1a3024',
                }}>
                  {player.final_position <= 3 ? player.final_position : '—'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── STANDINGS TABLE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(255,255,255,0.95)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {/* Table Header */}
            <div
              className="grid px-6 py-1.5"
              style={{
                gridTemplateColumns: '70px 1fr 140px 130px 100px',
                borderBottom: '2px solid rgba(26,92,53,0.12)',
                background: 'rgba(26,92,53,0.06)',
              }}
            >
              {['Rank', 'Player', 'Chips', 'Points', 'Status'].map((h) => (
                <span key={h} style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,42,26,0.45)',
                }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {standings.slice(0, 6).map((s, idx) => {
                const isMe = s.username === realPlayer?.username;
                const chips = s.final_chips || s.current_chips || 0;
                const isActive = s.status === 'active';
                const rank = idx + 1;

                // For active players, calculate projected points
                let points = s.points_earned;
                if (isActive && (points === null || points === undefined)) {
                  if (rank === 1) points = 1000;
                  else if (rank === 2) points = 100;
                  else if (rank === 3) points = 50;
                  else points = 0;
                }

                const isBusted = chips <= 0;

                return (
                  <div
                    key={s.player_id?.toString() ?? idx}
                    className="grid items-center px-6 py-1 transition-colors"
                    style={{
                      gridTemplateColumns: '70px 1fr 140px 130px 100px',
                      borderBottom: idx < Math.min(standings.length, 8) - 1 ? '1px solid rgba(26,42,26,0.06)' : 'none',
                      background: isMe ? 'rgba(201,168,76,0.08)' : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      {rank <= 3 ? (
                        <div className="relative flex items-center justify-center w-10 h-10">
                          <Medal className="w-9 h-9" style={{ color: rankColors[rank] }} />
                          <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '8px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 900,
                              color: rank === 1 ? '#3d2a00' : rank === 2 ? '#3a3a44' : '#3d1f0a',
                              fontFamily: FONTS.secondary,
                            }}>
                              {rank}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: '18px',
                          color: '#1a5c35',
                          fontWeight: 800,
                          marginLeft: '12px',
                          opacity: 0.6
                        }}>
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        type={s.avatar_url || 'default'}
                        size="md"
                        className={`flex-shrink-0 border-2 ${isMe ? 'border-[#1a5c35]/40 shadow-md' : 'border-black/5'}`}
                      />
                      <span style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: '16px',
                        fontWeight: 800,
                        color: isMe ? '#1a5c35' : '#1a2e1a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {s.username}
                      </span>
                    </div>

                    {/* Chips */}
                    <div className="flex items-center">
                      <span style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: '17px',
                        fontWeight: 700,
                        color: chips < 0 ? '#b83232' : isBusted ? 'rgba(26,42,26,0.2)' : '#1a2e1a',
                        whiteSpace: 'nowrap',
                      }}>
                        ${chips.toLocaleString()}
                      </span>
                    </div>

                    {/* Points */}
                    <div className="flex items-center">
                      <span style={{
                        display: 'inline-block',
                        padding: '5px 16px',
                        borderRadius: '99px',
                        fontSize: '15px',
                        fontFamily: "'Georgia', serif",
                        fontWeight: 700,
                        background: points > 0
                          ? 'rgba(26,92,53,0.1)'
                          : points < 0
                            ? 'rgba(184,50,50,0.1)'
                            : 'rgba(26,42,26,0.05)',
                        color: points > 0
                          ? '#1a5c35'
                          : points < 0
                            ? '#b83232'
                            : 'rgba(26,42,26,0.35)',
                        whiteSpace: 'nowrap',
                      }}>
                        {points >= 0 ? `+${points}` : points}
                        {isActive && (
                          <span className="block text-[8px] opacity-60 font-bold uppercase mt-0.5">Projected</span>
                        )}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      {rank === 1 ? (
                        <Trophy className="w-5 h-5" style={{ color: '#B8960C' }} />
                      ) : isBusted ? (
                        <Skull className="w-5 h-5" style={{ color: 'rgba(184,50,50,0.5)' }} />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" style={{ color: 'rgba(26,92,53,0.35)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exit CTA for non-winners */}
            {!isWinner && (
              <div className="flex flex-col items-center gap-2 mt-2 pb-2">
                <Link
                  href="/lobby"
                  className="px-8 py-3 rounded-xl bg-[#1a5c35] text-[#f5e9b8] font-bold uppercase tracking-widest text-[12px] shadow-lg hover:bg-[#144327] transition-all active:scale-95"
                >
                  Return to Lobby
                </Link>
              </div>
            )}
          </motion.div>

          {/* ── CHAMPIONSHIP POINTS SYSTEM ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full flex flex-col items-center gap-3 mt-1"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1" style={{ height: '1px', background: 'rgba(26,42,26,0.12)' }} />
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: '#1a5c35',
                opacity: 0.8
              }}>
                Points System
              </span>
              <div className="flex-1" style={{ height: '1px', background: 'rgba(26,42,26,0.12)' }} />
            </div>

            <div className="grid grid-cols-4 gap-4 w-full">
              {[
                { label: '1st Place', value: '+1000', icon: Trophy, color: '#8a6d08', valueBg: 'rgba(201,168,76,0.12)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(201,168,76,0.25)' },
                { label: '2nd Place', value: '+100', icon: Medal, color: '#555560', valueBg: 'rgba(122,122,138,0.1)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(122,122,138,0.2)' },
                { label: '3rd Place', value: '+50', icon: Medal, color: '#7a4e2a', valueBg: 'rgba(139,94,60,0.1)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(139,94,60,0.2)' },
                { label: 'Busted (0 Chips)', value: '-50', icon: XCircle, color: '#b83232', valueBg: 'rgba(184,50,50,0.1)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(184,50,50,0.2)' },
              ].map((rule) => (
                <div
                  key={rule.label}
                  className="flex flex-col items-center justify-center gap-0.5 px-4 py-2"
                  style={{
                    background: rule.bg,
                    borderRadius: '18px',
                    border: `1px solid ${rule.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <rule.icon className="w-6 h-6" style={{ color: rule.color, opacity: 0.7 }} />
                  <div className="flex flex-col items-center gap-2">
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#1a5c35',
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}>
                      {rule.label}
                    </span>
                    <span style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: '22px',
                      fontWeight: 800,
                      color: rule.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {rule.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}