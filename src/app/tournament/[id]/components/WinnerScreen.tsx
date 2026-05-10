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
    return [...tournament.players].map(p => ({
      ...p,
      current_chips: Math.max(0, p.current_chips || 0),
      final_chips: Math.max(0, p.final_chips || 0)
    })).sort((a, b) => {
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

      {/* Return to Lobby — top right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed top-6 right-6 z-[260]"
      >
        <Link
          href="/lobby"
          className="group flex items-center gap-2 transition-all active:scale-[0.97]"
          style={{
            padding: '14px 32px',
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
            Back to Lobby
          </span>
        </Link>
      </motion.div>

      {/* Main Container */}
      <div className="relative w-full flex flex-col items-center py-8 px-6" style={{ zIndex: 1 }}>
        <div className="w-full max-w-5xl flex flex-col items-center gap-6">

          {/* ── HEADER SECTION ── */}
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 'clamp(42px, 7vw, 64px)',
                fontWeight: 700,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: '4px',
                color: '#0d2a20',
                textShadow: '0 1px 0 rgba(201,168,76,0.1)',
                textAlign: 'center'
              }}
            >
              {isWinner ? 'Champion!' : 'Tournament Results'}
            </motion.h1>

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
                    paddingTop: '16px',
                    paddingBottom: '14px',
                    paddingLeft: '50px',
                    paddingRight: '50px',
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
                    fontSize: '26px',
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
          <div className="grid grid-cols-3 gap-4 w-full">
            {/* Final Chips */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-3 p-6"
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
                  fontSize: '22px',
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
              className="flex flex-col items-center gap-2 p-4"
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
                  fontSize: '32px',
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
              className="flex flex-col items-center gap-3 p-6"
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
                  fontSize: '32px',
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
              className="grid px-6 py-3"
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
              {standings.slice(0, 8).map((s, idx) => {
                const isMe = s.username === realPlayer?.username;
                const chips = s.final_chips || s.current_chips || 0;
                const rank = idx + 1;
                const points = s.points_earned || 0;
                const isBusted = chips <= 0;

                return (
                  <div
                    key={s.player_id?.toString() ?? idx}
                    className="grid items-center px-6 py-3.5 transition-colors"
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
                      <div
                        className="flex items-center justify-center flex-shrink-0 rounded-full"
                        style={{
                          width: '36px',
                          height: '36px',
                          background: isMe ? '#1a5c35' : 'rgba(26,42,26,0.07)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isMe ? '#f5e9b8' : 'rgba(26,42,26,0.45)',
                        }}
                      >
                        {s.username.substring(0, 2).toUpperCase()}
                      </div>
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
                  className="flex flex-col items-center justify-center gap-1 px-4 py-3"
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