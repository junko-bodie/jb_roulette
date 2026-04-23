'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTournament } from '@/lib/tournament/useTournament';
import RouletteTable from '@/components/table/RouletteTable';
import ChipTray from '@/components/chips/ChipTray';
import ResultDisplay from '@/components/ui/ResultDisplay';
import type { PlacedBet } from '@/lib/bets';
import EliminationScreen from './components/EliminationScreen';
import WinnerScreen from './components/WinnerScreen';
import Scoreboard from '@/components/tournament/Scoreboard';
import Avatar from '@/components/ui/Avatar';
import { useGame } from '@/context/GameContext';

export default function TournamentPage() {
  const {
    tournament,
    currentRound,
    currentSpin,
    phase,
    timeRemaining,
    scores,
    submitBets,
    completeSpin,
    lastSpinResult,
    lastPlayerPayout,
    eliminatedPlayer,
    allSpinBets,
    botBets,
    lobbyTimeRemaining,
    syncMyBets
  } = useTournament();
  const { userProfile } = useGame();

  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState<Map<string, any>>(new Map());
  const [deleteMode, setDeleteMode] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Synchronize phase with ResultDisplay
  useEffect(() => {
    if (phase === "result") {
      setShowResult(true);
    } else if (phase === "betting") {
      setShowResult(false);
      setBets(new Map()); // Clear local bets for next spin
    }
  }, [phase]);

  const totalBet = Array.from(bets.values()).reduce((sum, bet) => sum + bet.amount, 0);
  
  const player = useMemo(() => {
    if (!userProfile?.id || !tournament) return tournament?.players?.find(p => !p.is_bot);
    return tournament.players?.find(p => p.player_id.toString() === userProfile.id);
  }, [tournament, userProfile?.id]);

  const myChips = player?.current_chips || 0;

  const lastSubmittedSpinRef = useRef<number>(-1);

  const handleTimeout = useCallback(() => {
    // Only auto-submit if we haven't submitted for this spin yet
    if (phase === "locked" && currentSpin !== lastSubmittedSpinRef.current) {
      lastSubmittedSpinRef.current = currentSpin;
      const formattedBets = Array.from(bets.values());
      submitBets(formattedBets);
    }
  }, [phase, currentSpin, bets, submitBets]);

  useEffect(() => {
    if (timeRemaining === 0 && phase === "locked") {
      handleTimeout();
    }
  }, [timeRemaining, phase, handleTimeout]);

  // Sync bets to server for other players to see
  useEffect(() => {
    if (phase !== "betting" || bets.size === 0) return;
    
    // Sync immediately on first bet
    syncMyBets(Array.from(bets.values()));

    const syncInterval = setInterval(() => {
      syncMyBets(Array.from(bets.values()));
    }, 1000); // 1s sync frequency for real-time visibility

    return () => clearInterval(syncInterval);
  }, [phase, bets, syncMyBets]);

  const displayBets = useMemo(() => {
    // During spinning or result phase, we know all final bets from server
    if (phase === "spinning" || phase === "result") {
      const merged = new Map<string, PlacedBet>();
      allSpinBets.forEach((b: any) => {
        const existing = merged.get(b.betId);
        if (existing) {
          merged.set(b.betId, {
            betId: b.betId,
            amount: existing.amount + b.amount,
            chips: [...existing.chips, ...(b.chips || [b.amount])]
          });
        } else {
          merged.set(b.betId, {
            betId: b.betId,
            amount: b.amount,
            chips: b.chips || [b.amount]
          });
        }
      });
      return merged;
    }

    // During betting phase, merge human bets with context bot bets
    const merged = new Map<string, PlacedBet>(bets);
    if (botBets) {
      Object.values(botBets).forEach((botBetArray) => {
        botBetArray.forEach((b: PlacedBet) => {
          const existing = merged.get(b.betId);
          if (existing) {
            merged.set(b.betId, {
              betId: b.betId,
              amount: existing.amount + b.amount,
              chips: [...existing.chips, ...(b.chips || [b.amount])]
            });
          } else {
            merged.set(b.betId, {
              betId: b.betId,
              amount: b.amount,
              chips: b.chips || [b.amount]
            });
          }
        });
      });
    }

    // Include other real players' pending bets
    tournament?.players?.forEach(p => {
      // Only show other players' bets (we show our own from the 'bets' state)
      const isMe = userProfile?.id ? p.player_id.toString() === userProfile.id : !p.is_bot;
      if (!isMe && p.pending_bets) {
        p.pending_bets.forEach((b: any) => {
          const existing = merged.get(b.betId);
          if (existing) {
            merged.set(b.betId, {
              betId: b.betId,
              amount: existing.amount + b.amount,
              chips: [...existing.chips, ...(b.chips || [b.amount])]
            });
          } else {
            merged.set(b.betId, {
              betId: b.betId,
              amount: b.amount,
              chips: b.chips || [b.amount]
            });
          }
        });
      }
    });

    return merged;
  }, [phase, allSpinBets, bets, botBets, tournament?.players, userProfile?.id]);

  const handlePlaceBet = (betId: string) => {
    if (phase !== "betting") return;
    if (deleteMode) {
      const newBets = new Map(bets);
      newBets.delete(betId);
      setBets(newBets);
      return;
    }
    if (myChips < totalBet + selectedChip) return;

    const newBets = new Map(bets);
    const currentBetObj = newBets.get(betId);
    const currentAmount = currentBetObj ? currentBetObj.amount : 0;
    const currentChips = currentBetObj ? currentBetObj.chips : [];

    newBets.set(betId, {
      betId,
      amount: currentAmount + selectedChip,
      chips: [...currentChips, selectedChip]
    });
    setBets(newBets);
  };

  if (!tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050d0a',
      }}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          style={{ color: '#c9a44c', letterSpacing: '0.3em', fontWeight: 800, textTransform: 'uppercase' }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          CONNECTING TO TOURNAMENT...
        </motion.span>
      </div>
    );
  }

  // If real player is eliminated or tournament finished, show winner/summary
  if (phase === "completed" || (player?.status === "eliminated" && phase !== "elimination")) {
    if (player) {
      const summaryPlayer = {
        username: player.username,
        is_bot: player.is_bot,
        final_chips: player.current_chips,
        final_position: player.final_position || 1,
        eliminated_round: player.eliminated_round || 5
      };
      return <WinnerScreen tournament={tournament} player={summaryPlayer} />;
    }
  }

  const isUrgent = timeRemaining <= 10;

  // ════════════ MATCHMAKING LOBBY OVERLAY ════════════
  if (tournament.status === 'waiting') {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Background Accents */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.05)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(201,164,76,0.03)', borderRadius: '50%', filter: 'blur(80px)' }} />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            zIndex: 10,
            width: '90%',
            maxWidth: '600px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(201, 164, 76, 0.4)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            textAlign: 'center'
          }}
        >
          <div style={{ color: '#c9a44c', fontWeight: 900, letterSpacing: '0.3em', fontSize: '10px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Tournament Matchmaking
          </div>
          <h2 style={{ fontSize: '32px', color: '#fff', fontWeight: 900, marginBottom: '8px' }}>
            Searching for Players...
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
            Filling remaining spots with bots in {lobbyTimeRemaining}s
          </p>

          {/* Players Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            marginBottom: '40px' 
          }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const p = tournament.players[i];
              return (
                <div key={i} style={{
                  background: p ? 'rgba(201,164,76,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${p ? 'rgba(201,164,76,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '16px',
                  padding: '16px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: p ? 1 : 0.4
                }}>
                  <Avatar type={p?.avatar_url || 'default'} size="md" />
                  <span style={{ 
                    color: p ? '#fff' : 'rgba(255,255,255,0.2)', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {p ? p.username : 'EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{ width: '20px', height: '20px', border: '3px solid rgba(201,164,76,0.2)', borderTopColor: '#c9a44c', borderRadius: '50%' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '13px' }}>
              Matched {tournament.players.length}/6 Players
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
      background: 'radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)',
    }}>

      {/* ═══ TOP HEADER — TOURNAMENT INFO + TIMER ═══ */}
      <header style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        padding: '12px 24px',
        background: 'linear-gradient(to bottom, #3b2518, #1c100a)',
        borderBottom: '2px solid rgba(201, 164, 76, 0.4)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
        zIndex: 10,
      }}>
        {/* Round & Spin Info */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(16px, 2.5vw, 28px)',
            fontWeight: 900,
            color: '#c9a44c',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1,
          }}>
            Round {currentRound} of 5
          </h1>
          <div style={{
            marginTop: '4px',
            fontSize: 'clamp(11px, 1.5vw, 14px)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Spin {currentSpin} of 5
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '36px', background: 'rgba(201, 164, 76, 0.3)' }} />

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${isUrgent ? '#ef4444' : '#c9a44c'}`,
            background: 'rgba(0,0,0,0.7)',
            boxShadow: isUrgent ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 15px rgba(0,0,0,0.5)',
            animation: isUrgent ? 'pulse 1s infinite' : 'none',
          }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 900,
              color: isUrgent ? '#ef4444' : '#c9a44c',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {timeRemaining}
            </span>
          </div>
          <div style={{
            fontSize: '9px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            lineHeight: 1.3,
          }}>
            {phase === 'betting' ? 'BETS\nOPEN' : phase.toUpperCase()}
          </div>
        </div>
      </header>

      {/* ═══ MAIN GAME AREA — Grid: [Table] [Scoreboard] ═══ */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: '16px',
        padding: '12px 16px',
        overflow: 'hidden',
      }}>

        {/* Roulette Table — takes most of the space */}
        <div style={{
          flex: '1 1 0',
          minWidth: 0,
          maxWidth: '1100px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <RouletteTable
            wheelType="american"
            currentResult={lastSpinResult}
            isSpinning={phase === "spinning"}
            onSpinComplete={completeSpin}
            wheelSize={380}
            wheelRef={wheelRef}
            bets={displayBets as any}
            onPlaceBet={handlePlaceBet}
            onRemoveBet={(betId) => {
              const newBets = new Map(bets);
              newBets.delete(betId);
              setBets(newBets);
            }}
            isBettingDisabled={phase !== "betting"}
            lastPayout={lastPlayerPayout}
            phase={phase === "betting" ? "BETTING" : phase === "locked" ? "LOCKED" : "RESULT"}
            setWheelType={() => { }}
            onSpin={() => handleTimeout()}
            onRebet={() => { }}
            onClearBets={() => setBets(new Map())}
            onClearLastBet={() => { }}
            hasLastSpin={false}
            balance={myChips}
            totalBet={totalBet}
            onDoubleAllBets={() => true}
            onToggleDeleteMode={() => setDeleteMode(!deleteMode)}
            deleteMode={deleteMode}
            onPopLastChip={() => { }}
            onClearZone={() => { }}
            onTimeout={handleTimeout}
            tournamentMode={true}
          />
        </div>

        {/* Scoreboard Sidebar */}
        <div style={{ flexShrink: 0, paddingTop: '8px' }}>
          <Scoreboard />
        </div>
      </main>

      {/* ═══ FOOTER — CHIP TRAY + CONTROLS ═══ */}
      <footer style={{
        flexShrink: 0,
        width: '100%',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to top, #1a0f09 0%, #2d1a10 100%)',
        borderTop: '1px solid rgba(201, 164, 76, 0.3)',
        zIndex: 10,
      }}>

        <div style={{ flex: '1 1 auto', display: 'flex', maxWidth: '480px' }}>
          <ChipTray
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            balance={myChips}
            totalBet={totalBet}
            disabled={phase !== "betting"}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Balance display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              color: 'rgba(201, 164, 76, 0.5)',
              fontWeight: 800,
              letterSpacing: '0.15em',
            }}>
              Live Balance
            </span>
            <span style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#fff',
            }}>
              ${myChips.toLocaleString()}
            </span>
          </div>

          {/* Clear Bets button */}
          {bets.size > 0 && phase === 'betting' && (
            <button
              onClick={() => setBets(new Map())}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Clear
            </button>
          )}

          {/* Place Bets button */}
          <button
            onClick={handleTimeout}
            disabled={phase !== "betting"}
            style={{
              padding: '10px 28px',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              background: phase === 'betting' ? '#c9a44c' : 'rgba(255,255,255,0.05)',
              color: phase === 'betting' ? '#111' : 'rgba(255,255,255,0.2)',
              border: phase === 'betting' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: phase === 'betting' ? 'pointer' : 'not-allowed',
              boxShadow: phase === 'betting' ? '0 0 20px rgba(201,164,76,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {phase === "betting" ? "Place Bets" : phase.toUpperCase()}
          </button>
        </div>
      </footer>

      <ResultDisplay
        visible={showResult}
        onDismiss={() => setShowResult(false)}
        result={lastSpinResult}
        payout={lastPlayerPayout}
      />

      <EliminationScreen
        player={eliminatedPlayer}
        visible={phase === "elimination" && currentRound < 5}
      />
    </div>
  );
}
