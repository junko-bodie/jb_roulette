'use client';

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowRight,
  Users,
  Clock,
  CircleDollarSign,
  Medal,
  Skull,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Star,
  Crown
} from 'lucide-react';
import { COLORS, FONTS } from '@/styles/theme';

interface WinnerScreenProps {
  tournament: any;
  player: {
    username: string;
    is_bot: boolean;
    final_chips: number;
    final_position: number;
    eliminated_round: number;
  };
}

export default function WinnerScreen({ tournament, player }: WinnerScreenProps) {
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
    return [...tournament.players].sort((a, b) => {
      const posA = a.final_position || (a.status === 'active' ? 1 : 6);
      const posB = b.final_position || (b.status === 'active' ? 1 : 6);
      return posA - posB;
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
      className="fixed inset-0 z-[250] overflow-y-auto flex flex-col items-center bg-[#f5eedc]"
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

      {/* Main Container */}
      <div className="relative w-full min-h-screen flex flex-col items-center justify-center py-6 px-6" style={{ zIndex: 1 }}>
        <div className="w-full max-w-3xl flex flex-col items-center gap-1.5">

          {/* ── HEADER SECTION ── */}
          <div className="flex flex-col items-center w-full">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 mb-1"
            >
              <div className="h-px w-8" style={{ background: 'rgba(26,92,53,0.2)' }} />
              <span style={{
                fontSize: '9px',
                fontFamily: "'Helvetica Neue', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.4em',
                color: 'rgba(26,92,53,0.5)',
                textTransform: 'uppercase'
              }}>
                Tournament Results
              </span>
              <div className="h-px w-8" style={{ background: 'rgba(26,92,53,0.2)' }} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 'clamp(42px, 7vw, 68px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: '4px',
                color: '#1a3d24',
                textShadow: '0 1px 0 rgba(201,168,76,0.15)',
                textAlign: 'center'
              }}
            >
              {isWinner ? 'Champion!' : 'Tournament Over'}
            </motion.h1>

            {/* Hero emblem */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative flex flex-col items-center mb-2 mt-0.5"
            >
              <div className="relative z-10 flex items-center justify-center" style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #f0e6c0 0%, #d4a820 50%, #b8960c 100%)',
                boxShadow: '0 3px 0 #8a6d08, 0 6px 24px rgba(180,140,12,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
                border: '2px solid rgba(255,255,255,0.6)',
              }}>
                <Trophy className="w-9 h-9" style={{ color: '#3d2a00' }} />
              </div>

              {/* Name banner ribbon — wider, taller, overflow-visible so text never clips */}
              <div
                className="relative z-20 mt-[-14px]"
                style={{ width: 'auto', minWidth: '300px', maxWidth: '420px' }}
              >
                <div
                  className="relative flex flex-col items-center justify-center"
                  style={{
                    paddingTop: '14px',
                    paddingBottom: '12px',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    background: 'linear-gradient(135deg, #1a4d28 0%, #1a5c35 50%, #1a4d28 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
                    borderTop: '1px solid rgba(201,168,76,0.4)',
                    borderBottom: '1px solid rgba(201,168,76,0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* Left ribbon tail */}
                  <div className="absolute -left-3.5 top-0 bottom-0 w-3.5" style={{
                    background: '#143d20',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 50%)',
                    flexShrink: 0,
                  }} />
                  {/* Right ribbon tail */}
                  <div className="absolute -right-3.5 top-0 bottom-0 w-3.5" style={{
                    background: '#143d20',
                    clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
                    flexShrink: 0,
                  }} />

                  <span style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#f5e9b8',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                  }}>
                    {player.username}
                  </span>
                  <span style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#C9A84C',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    marginTop: '3px',
                  }}>
                    {positionLabel(player.final_position)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── SUMMARY CARDS ── */}
          <div className="grid grid-cols-3 gap-4 w-full mt-2">
            {/* Final Chips */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2 p-5"
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
                <CircleDollarSign className="w-4 h-4 flex-shrink-0" style={{ color: '#B8960C' }} />
                <span style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1a3024',
                  whiteSpace: 'nowrap',
                }}>
                  ${player.final_chips.toLocaleString()}
                </span>
              </div>
            </motion.div>

            {/* Championship Points */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col items-center gap-2 p-5"
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
                Points
              </span>
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '26px',
                  fontWeight: 700,
                  color: pointsEarned >= 0 ? '#1a5c35' : '#b83232',
                }}>
                  {pointsEarned >= 0 ? `+${pointsEarned}` : pointsEarned}
                </span>
                <TrendingUp
                  className={`w-4 h-4 flex-shrink-0 ${pointsEarned < 0 ? 'rotate-180' : ''}`}
                  style={{ color: pointsEarned >= 0 ? '#1a5c35' : '#b83232' }}
                />
              </div>
            </motion.div>

            {/* Tournament Info */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col justify-center gap-3 p-5"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(26,42,26,0.45)' }} />
                <span style={{ fontFamily: "'Georgia', serif", fontSize: '14px', fontWeight: 700, color: '#1a3024' }}>
                  {standings.length} Players
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(26,42,26,0.45)' }} />
                <span style={{ fontFamily: "'Georgia', serif", fontSize: '14px', fontWeight: 700, color: '#1a3024' }}>
                  {durationStr}
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── STANDINGS TABLE ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full mt-1"
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
              className="grid px-6 py-3"
              style={{
                gridTemplateColumns: '60px 1fr 130px 120px 90px',
                borderBottom: '1px solid rgba(26,42,26,0.08)',
                background: 'rgba(26,92,53,0.04)',
              }}
            >
              {['Rank', 'Player', 'Chips', 'Points', 'Status'].map((h) => (
                <span key={h} style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,42,26,0.4)',
                }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {standings.slice(0, 8).map((s, idx) => {
                const isMe = s.username === realPlayer?.username;
                const chips = s.final_chips || s.current_chips || 0;
                const rank = idx + 1;
                const points = s.points_earned || 0;
                const isBusted = chips <= 0;

                return (
                  <div
                    key={s.player_id?.toString() ?? idx}
                    className="grid items-center px-6 py-4 transition-colors"
                    style={{
                      gridTemplateColumns: '60px 1fr 130px 120px 90px',
                      borderBottom: idx < Math.min(standings.length, 8) - 1 ? '1px solid rgba(26,42,26,0.05)' : 'none',
                      background: isMe ? 'rgba(201,168,76,0.07)' : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      {rank <= 3 ? (
                        <div className="relative flex items-center justify-center w-8 h-8">
                          <Medal className="w-8 h-8" style={{ color: rankColors[rank] }} />
                          <span className="absolute inset-0 flex items-center justify-center" style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: rank === 1 ? '#3d2a00' : rank === 2 ? '#3a3a44' : '#3d1f0a',
                          }}>
                            {rank}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: '15px',
                          color: 'rgba(26,42,26,0.3)',
                          fontWeight: 700,
                          marginLeft: '10px',
                        }}>
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex items-center justify-center flex-shrink-0 rounded-full"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: isMe ? '#1a5c35' : 'rgba(26,42,26,0.07)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isMe ? '#f5e9b8' : 'rgba(26,42,26,0.45)',
                        }}
                      >
                        {s.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: '15px',
                        fontWeight: 700,
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
                        fontSize: '15px',
                        fontWeight: 700,
                        color: isBusted ? 'rgba(26,42,26,0.2)' : '#1a2e1a',
                        whiteSpace: 'nowrap',
                      }}>
                        ${chips.toLocaleString()}
                      </span>
                    </div>

                    {/* Points */}
                    <div className="flex items-center">
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: '99px',
                        fontSize: '13px',
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
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      {rank === 1 ? (
                        <Trophy className="w-4 h-4" style={{ color: '#B8960C' }} />
                      ) : isBusted ? (
                        <Skull className="w-4 h-4" style={{ color: 'rgba(184,50,50,0.5)' }} />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" style={{ color: 'rgba(26,92,53,0.3)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── CHAMPIONSHIP POINTS SYSTEM ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full flex flex-col items-center gap-4 mt-3"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1" style={{ height: '1px', background: 'rgba(26,42,26,0.12)' }} />
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'rgba(26,92,53,0.5)',
              }}>
                Points System
              </span>
              <div className="flex-1" style={{ height: '1px', background: 'rgba(26,42,26,0.12)' }} />
            </div>

            <div className="grid grid-cols-4 gap-3 w-full">
              {[
                { label: '1st Place', value: '+1000', icon: Trophy, color: '#8a6d08', valueBg: 'rgba(201,168,76,0.12)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(201,168,76,0.25)' },
                { label: '2nd Place', value: '+100', icon: Medal, color: '#555560', valueBg: 'rgba(122,122,138,0.1)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(122,122,138,0.2)' },
                { label: '3rd Place', value: '+50', icon: Medal, color: '#7a4e2a', valueBg: 'rgba(139,94,60,0.1)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(139,94,60,0.2)' },
                { label: 'Busted', value: '-50', icon: XCircle, color: '#b83232', valueBg: 'rgba(184,50,50,0.1)', bg: 'rgba(255,255,255,0.8)', border: 'rgba(184,50,50,0.2)' },
              ].map((rule) => (
                <div
                  key={rule.label}
                  className="flex flex-col items-center justify-center gap-3 px-4 py-5"
                  style={{
                    background: rule.bg,
                    borderRadius: '16px',
                    border: `1px solid ${rule.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <rule.icon className="w-5 h-5" style={{ color: rule.color, opacity: 0.7 }} />
                  <div className="flex flex-col items-center gap-1">
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(26,42,26,0.5)',
                      whiteSpace: 'nowrap',
                    }}>
                      {rule.label}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 12px',
                      borderRadius: '99px',
                      background: rule.valueBg,
                      fontFamily: "'Georgia', serif",
                      fontSize: '17px',
                      fontWeight: 700,
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

          {/* ── CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 mb-2"
          >
            <Link
              href="/lobby"
              className="group relative flex items-center gap-2.5 overflow-hidden transition-all active:scale-[0.97]"
              style={{
                padding: '15px 48px',
                borderRadius: '12px',
                background: '#1a5c35',
                boxShadow: '0 4px 0 #0f3d22, 0 8px 20px rgba(26,92,53,0.25)',
              }}
            >
              <span style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#f5e9b8',
              }}>
                Return to Lobby
              </span>
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                style={{ color: '#f5e9b8' }}
              />
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}