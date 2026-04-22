'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTournament } from '@/lib/tournament/useTournament';
import RouletteTable from '@/components/table/RouletteTable';
import ChipTray from '@/components/chips/ChipTray';
import ResultDisplay from '@/components/ui/ResultDisplay';
import EliminationScreen from './components/EliminationScreen';
import WinnerScreen from './components/WinnerScreen';
import Scoreboard from '@/components/tournament/Scoreboard';

export default function TournamentPage() {
  const { 
    tournament, 
    currentRound, 
    currentSpin, 
    phase, 
    timeRemaining, 
    scores,
    submitBets,
    lastSpinResult,
    lastPlayerPayout,
    eliminatedPlayer 
  } = useTournament();

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

  const totalBet = Array.from(bets.values()).reduce((a, b) => a + b, 0);
  const player = tournament?.players.find(p => !p.is_bot);
  const myChips = player?.current_chips || 0;

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
    const currentBet = newBets.get(betId) || 0;
    newBets.set(betId, currentBet + selectedChip);
    setBets(newBets);
  };

  const handleTimeout = () => {
    if (phase === "betting") {
      const formattedBets = Array.from(bets.entries()).map(([betId, amount]) => ({
        betId,
        amount,
        chips: [amount]
      }));
      submitBets(formattedBets);
    }
  };

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050d0a] text-gold">
        <div className="text-2xl font-black animate-pulse uppercase tracking-widest">
          CONNECTING TO TOURNAMENT...
        </div>
      </div>
    );
  }

  // If real player is eliminated or tournament finished, show winner/summary
  const realPlayerEliminated = tournament.players.find(p => !p.is_bot)?.status === "eliminated";
  if (phase === "completed" || (realPlayerEliminated && phase !== "elimination")) {
    const me = tournament.players.find((p: any) => !p.is_bot);
    if (me) {
      const summaryPlayer = {
        username: me.username,
        is_bot: me.is_bot,
        final_chips: me.current_chips,
        final_position: me.final_position || 1,
        eliminated_round: me.eliminated_round || 5
      };
      return <WinnerScreen tournament={tournament} player={summaryPlayer} />;
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden select-none" style={{ background: `radial-gradient(circle at 30% 50%, #165b45 0%, #0d2a20 100%)` }}>
      
      {/* ═══ TOP HEADER — TOURNAMENT STATS ═══ */}
      <header className="flex-shrink-0 flex flex-col items-center justify-center py-4 z-10" style={{ background: 'linear-gradient(to bottom, #3b2518, #1c100a)', borderBottom: '2px solid rgba(201, 164, 76, 0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.6)' }}>
        <h1 className="text-xl md:text-3xl font-black text-gold tracking-[0.2em] uppercase m-0 leading-none">
          Round {currentRound} of 5
        </h1>
        <div className="mt-1 text-sm md:text-base font-bold text-white/60 tracking-widest uppercase">
          Spin {currentSpin} of 20
        </div>
      </header>

      {/* ═══ MAIN GAME AREA ═══ */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {/* Scoreboard on the right */}
        <Scoreboard />

        {/* Center: Roulette Table */}
        <div className="w-full max-w-5xl flex flex-col items-center pr-80"> {/* Padding to avoid scoreboard overlap */}
          <RouletteTable
            wheelType="american"
            currentResult={lastSpinResult}
            isSpinning={phase === "spinning"}
            onSpinComplete={() => {}} 
            wheelSize={400}
            wheelRef={wheelRef}
            bets={bets as any}
            onPlaceBet={handlePlaceBet}
            onRemoveBet={(betId) => {
              const newBets = new Map(bets);
              newBets.delete(betId);
              setBets(newBets);
            }}
            isBettingDisabled={phase !== "betting"}
            lastPayout={lastPlayerPayout}
            phase={phase === "betting" ? "BETTING" : phase === "locked" ? "LOCKED" : "RESULT"}
            setWheelType={() => {}}
            onSpin={() => handleTimeout()}
            onRebet={() => {}}
            onClearBets={() => setBets(new Map())}
            onClearLastBet={() => {}}
            hasLastSpin={false}
            balance={myChips}
            totalBet={totalBet}
            onDoubleAllBets={() => true}
            onToggleDeleteMode={() => setDeleteMode(!deleteMode)}
            deleteMode={deleteMode}
            onPopLastChip={() => {}}
            onClearZone={() => {}}
            onTimeout={handleTimeout}
          />
        </div>

        {/* Floating Timer */}
        <div className="fixed top-24 right-96 z-20"> {/* Shifted left to avoid scoreboard overlap */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${timeRemaining <= 10 ? 'border-red-500 animate-pulse' : 'border-gold'} bg-black/80 shadow-2xl`}>
            <span className={`text-2xl font-black ${timeRemaining <= 10 ? 'text-red-500' : 'text-gold'}`}>{timeRemaining}</span>
          </div>
          <div className="text-[10px] text-center mt-1 font-black text-white/50 uppercase tracking-tighter">BETS LOCKING</div>
        </div>
      </main>

      {/* ═══ FOOTER — CONTROLS ═══ */}
      <footer className="flex-shrink-0 w-full px-8 py-3 flex items-center justify-between z-10" style={{ background: 'linear-gradient(to top, #1a0f09 0%, #2d1a10 100%)', borderTop: '1px solid rgba(201, 164, 76, 0.3)' }}>
        
        <div className="flex-1 flex max-w-md">
          <ChipTray
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            balance={myChips}
            totalBet={totalBet}
            disabled={phase !== "betting"}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-gold/60 font-bold tracking-widest">Live Balance</span>
            <span className="text-xl font-black text-white">${myChips.toLocaleString()}</span>
          </div>

          <button 
            onClick={handleTimeout}
            disabled={phase !== "betting"}
            className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
              phase === "betting"
                ? 'bg-gold text-black shadow-[0_0_20px_rgba(201,164,76,0.4)] hover:scale-105 active:scale-95'
                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
            }`}
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
