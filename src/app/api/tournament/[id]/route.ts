import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { calculatePayouts } from '@/lib/payouts';
import { AMERICAN_WHEEL_ORDER, EUROPEAN_WHEEL_ORDER, getDisplayNumber, getNumberColor } from '@/lib/rng';
import { generateAllRoundBotBets } from '@/lib/tournament/serverBotBetting';
import { awardTournamentRewards } from '@/lib/tournament/rewards';
import { getRandomBotName } from '@/lib/tournament/botNames';

// Phase timing constants (ms)
const SPINNING_DURATION = 5000;  // 5s wheel animation
const RESULT_DURATION   = 2000;  // 2s result screen
const BETTING_DURATION  = 30000; // 30s betting window
const ELIMINATION_DURATION = 6000; // 6s elimination show
// Full cycle per spin: SPINNING + RESULT + BETTING = 50s

function getSpinResult(wheelType: 'american' | 'european' = 'american') {
  const pockets = wheelType === 'american' ? AMERICAN_WHEEL_ORDER : EUROPEAN_WHEEL_ORDER;
  const num = pockets[Math.floor(Math.random() * pockets.length)];
  return {
    number: num,
    displayNumber: getDisplayNumber(num),
    color: getNumberColor(num),
    parity: num === 0 || num === 37 ? 'none' : (num % 2 === 0 ? 'even' : 'odd'),
    dozen: num === 0 || num === 37 ? 'none' : (num <= 12 ? '1st' : num <= 24 ? '2nd' : '3rd'),
    column: num === 0 || num === 37 ? 'none' : (num % 3 === 1 ? '1st' : num % 3 === 2 ? '2nd' : '3rd'),
    half: num === 0 || num === 37 ? 'none' : (num <= 18 ? '1-18' : '19-36'),
    created_at: new Date(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const tournament = await db.collection('tournaments').findOne({ _id: new ObjectId(id) });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const now = Date.now();
    let phase: string = tournament.status === 'active' ? 'betting' : 'waiting';

    // ──────────────────────────────────────────────────────────────
    // AUTO-START WATCHDOG: Activate lobby if time expired (>10s)
    // ──────────────────────────────────────────────────────────────
    if (tournament.status === 'waiting' && tournament.created_at) {
      const created = new Date(tournament.created_at).getTime();
      if (now > created + 30000) {
        console.log(`[Watchdog] Auto-activating tournament ${id}`);

        // Fill remaining spots with bots
        const currentPlayers = tournament.players || [];
        const neededBots = Math.max(0, 6 - currentPlayers.length);
        const usedNames: string[] = currentPlayers.map((p: any) => p.username);
        
        const bots = Array.from({ length: neededBots }).map(() => {
          const botName = getRandomBotName(usedNames);
          usedNames.push(botName);
          return {
            player_id: new ObjectId(),
            username: botName,
            avatar_url: '/avatars/bot.png',
            is_bot: true,
            starting_chips: 2000,
            current_chips: 2000,
            status: 'active',
            eliminated_round: null,
            final_position: null,
            points_earned: null,
          };
        });

        const updateOp: any = { $set: { status: 'active' } };
        if (bots.length > 0) updateOp.$push = { players: { $each: bots } };
        await db.collection('tournaments').updateOne({ _id: new ObjectId(id) }, updateOp as any);

        // Re-fetch after update
        const updated = await db.collection('tournaments').findOne({ _id: new ObjectId(id) });
        Object.assign(tournament, updated);
        phase = 'betting';
      }
    }

    // ──────────────────────────────────────────────────────────────
    // Fetch latest round & latest spin
    // ──────────────────────────────────────────────────────────────
    let activeRound = await db.collection('rounds').findOne(
      { tournament_id: new ObjectId(id) },
      { sort: { created_at: -1 } }
    );

    const latestSpin = await db.collection('spins').findOne(
      { tournament_id: new ObjectId(id) },
      { sort: { created_at: -1 } }
    );

    let bettingDeadline = 0;

    if (tournament.status === 'active' && activeRound) {
      const spinsCompleted: number = activeRound.spins_completed || 0;

      if (spinsCompleted >= 5) {
        // ── Round is over — run elimination if not yet done ──
        
        // Check if we just finished the 5th spin and are still in its SPINNING or RESULT phase
        const lastSpin = latestSpin && latestSpin.round_id?.toString() === activeRound._id?.toString() && latestSpin.spin_number === 5;
        const spinCreatedAt = lastSpin ? new Date(latestSpin.created_at).getTime() : 0;
        const resultWindowEnds = spinCreatedAt + SPINNING_DURATION + RESULT_DURATION;

        if (lastSpin && now < resultWindowEnds) {
          // Still in the 5th spin's visual window
          if (now < spinCreatedAt + SPINNING_DURATION) {
            phase = 'spinning';
          } else {
            phase = 'result';
          }
        } else {
          phase = 'elimination';
        }

        if (phase === 'elimination') {

        const alreadyEliminated = !!activeRound.eliminated_player_id;
        if (!alreadyEliminated) {
          const activePlayers = (tournament.players || [])
            .filter((p: any) => p.status === 'active')
            .map((player: any, _: number, arr: any[]) => ({
              ...player,
              originalIndex: tournament.players.findIndex(
                (p: any) => p.player_id.toString() === player.player_id.toString()
              ),
            }))
            .sort((a: any, b: any) =>
              a.current_chips !== b.current_chips
                ? a.current_chips - b.current_chips
                : b.originalIndex - a.originalIndex
            );

          if (activePlayers.length > 1) {
            const loser = activePlayers[0];
            const currentRound = tournament.current_round || 1;
            const finalPosition = 7 - currentRound;

            console.log(`[Watchdog] Eliminating ${loser.username} (pos ${finalPosition})`);

            await db.collection('tournaments').updateOne(
              { _id: new ObjectId(id), 'players.player_id': loser.player_id },
              {
                $set: {
                  'players.$.status': 'eliminated',
                  'players.$.eliminated_round': currentRound,
                  'players.$.final_position': finalPosition,
                },
                $inc: { current_round: 1 },
              }
            );

            await db.collection('rounds').updateOne(
              { _id: activeRound._id },
              {
                $set: {
                  eliminated_player_id: loser.player_id,
                  status: 'completed',
                  completed_at: new Date(),
                },
              }
            );

            // Re-fetch tournament to get updated player list and current_round
            const freshTournament = await db.collection('tournaments').findOne({ _id: new ObjectId(id) });
            if (freshTournament) Object.assign(tournament, freshTournament);
          }
        }

        // Auto-create next round if elimination is already resolved (or was just resolved)
        const elimTime = activeRound.completed_at ? new Date(activeRound.completed_at).getTime() : 0;
        const isElimResolved = alreadyEliminated && (now > elimTime + ELIMINATION_DURATION);
        
        if (isElimResolved) {
          const existingNextRound = await db.collection('rounds').findOne({
            tournament_id: new ObjectId(id),
            status: 'active',
          });

          if (!existingNextRound && (tournament.players || []).filter((p: any) => p.status === 'active').length > 1) {
            const nextRoundNumber = tournament.current_round || 1;
            console.log(`[Watchdog] Creating Round ${nextRoundNumber}`);

            const activeBots = (tournament.players || []).filter((p: any) => p.is_bot && p.status === 'active');
            const allBotBets: any[] = [];
            activeBots.forEach((bot: any) => allBotBets.push(...generateAllRoundBotBets(bot)));

            const roundNow = new Date();
            const newRound = {
              tournament_id: new ObjectId(id),
              round_number: nextRoundNumber,
              status: 'active',
              spins_completed: 0,
              players_remaining: (tournament.players || [])
                .filter((p: any) => p.status === 'active')
                .map((p: any) => p.player_id),
              eliminated_player_id: null,
              created_at: roundNow,
              last_spin_completed_at: roundNow,
              betting_ends_at: new Date(roundNow.getTime() + BETTING_DURATION),
              completed_at: null,
              bot_bets: allBotBets,
            };

            const ins = await db.collection('rounds').insertOne(newRound as any);
            activeRound = { ...newRound, _id: ins.insertedId };
            phase = 'betting';
          } else if (existingNextRound) {
            // If next round already exists, transition to it
            activeRound = existingNextRound;
            phase = 'betting';
          }
        }
      }
    } else {
      // ── Round in progress — calculate phase from server clock ──
        bettingDeadline = activeRound.betting_ends_at
          ? new Date(activeRound.betting_ends_at).getTime()
          : 0;

        // Find the spin for the CURRENT spin slot
        const currentSpinNumber = spinsCompleted + 1;
        const currentSpin = latestSpin &&
          latestSpin.round_id.toString() === activeRound._id.toString() &&
          latestSpin.spin_number === currentSpinNumber
            ? latestSpin
            : null;

        if (currentSpin) {
          const spinTime = new Date(currentSpin.created_at).getTime();
          if (now < spinTime + SPINNING_DURATION) {
            phase = 'spinning';
          } else if (now < spinTime + SPINNING_DURATION + RESULT_DURATION) {
            phase = 'result';
          } else {
            // Result has been shown long enough — betting is open
            phase = 'betting';
          }
        } else if (bettingDeadline > 0) {
          const readyPlayers = (activeRound as any).ready_players || [];
          const activeRealPlayers = (tournament.players || []).filter((p: any) => p.status === 'active' && !p.is_bot);
          
          // A player is only truly ready if they are in the ready_players list AND have pending bets
          const allReady = activeRealPlayers.length > 0 && activeRealPlayers.every((p: any) => 
            readyPlayers.includes(p.player_id.toString()) && 
            p.pending_bets && p.pending_bets.length > 0
          );

          if (now < bettingDeadline && !allReady) {
            phase = 'betting';
          } else {
            // ── AUTO-SPIN WATCHDOG: betting deadline passed, execute spin ──
            const GRACE = 2000; // 2s grace
            if (now > bettingDeadline + GRACE) {
              console.log(`[Watchdog] Auto-spinning for round ${activeRound._id}, spin ${currentSpinNumber}`);

              const existing = await db.collection('spins').findOne({
                tournament_id: new ObjectId(id),
                round_id: activeRound._id,
                spin_number: currentSpinNumber,
              });

              if (!existing) {
                const result = getSpinResult(tournament.wheel_type || 'american');
                const chipUpdates: Record<string, number> = {};
                const playerResults: any[] = [];

                const activePlayers = (tournament.players || []).filter((p: any) => p.status === 'active');
                activePlayers.forEach((player: any) => {
                  const pidStr = player.player_id.toString();
                  let bets: any[] = [];

                  if (player.is_bot) {
                    bets = ((activeRound as any).bot_bets || [])
                      .filter((b: any) => b.player_id.toString() === pidStr && b.spin_number === currentSpinNumber)
                      .map((b: any) => ({ betId: b.betId, amount: b.amount, chips: b.chips }));
                  } else {
                    bets = player.pending_bets || [];
                  }

                  const payout = calculatePayouts(bets, result as any);
                  const newChips = player.current_chips + payout.netResult;
                  chipUpdates[pidStr] = newChips;

                  playerResults.push({
                    player_id: player.player_id,
                    username: player.username,
                    is_bot: player.is_bot,
                    bets_placed: bets,
                    chips_before: player.current_chips,
                    chips_after: newChips,
                    net_change: payout.netResult,
                    won: payout.totalWon,
                  });
                });

                await db.collection('spins').insertOne({
                  tournament_id: new ObjectId(id),
                  round_id: activeRound._id,
                  spin_number: currentSpinNumber,
                  result,
                  player_results: playerResults,
                  created_at: new Date(),
                  is_auto: true,
                });

                // Update chip counts AND CLEAR PENDING BETS on tournament
                const bulkOps = activePlayers.map((player: any) => {
                  const pidStr = player.player_id.toString();
                  return {
                    updateOne: {
                      filter: { _id: new ObjectId(id), 'players.player_id': player.player_id },
                      update: { 
                        $set: { 
                          'players.$.current_chips': chipUpdates[pidStr] ?? player.current_chips,
                          'players.$.pending_bets': [] // CRITICAL: Clear for next spin
                        } 
                      },
                    },
                  };
                });
                
                if (bulkOps.length > 0) await db.collection('tournaments').bulkWrite(bulkOps as any);

                // Advance round: set next betting window or null if last spin
                const isLastSpin = currentSpinNumber >= 5;
                const nextBettingEndsAt = isLastSpin
                  ? null
                  : new Date(Date.now() + SPINNING_DURATION + RESULT_DURATION + BETTING_DURATION);

                await db.collection('rounds').updateOne(
                  { _id: activeRound._id },
                  {
                    $inc: { spins_completed: 1 },
                    $set: {
                      betting_ends_at: nextBettingEndsAt,
                      last_spin_completed_at: new Date(),
                      ready_players: [], // RESET ready players for the next spin
                    },
                  }
                );

                phase = 'spinning';
              } else {
                phase = 'spinning';
              }
            } else {
              phase = 'locked';
            }
          }
        }
      }

      // ── AUTO-WINNER: only 1 active player remains ──
      const totalActive = (tournament.players || []).filter((p: any) => p.status === 'active');
      if (totalActive.length === 1 && tournament.status === 'active') {
        const winner = totalActive[0];
        console.log(`[Watchdog] Tournament ${id} completed. Winner: ${winner.username}`);
        await db.collection('tournaments').updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'completed', winner_id: winner.player_id, completed_at: new Date() } }
        );
        // Award Junko Bodie rewards
        await awardTournamentRewards(id);
        phase = 'completed';
      }
    }

    if (tournament.status === 'completed') {
      phase = 'completed';
    }

    // Re-fetch active round in case it was just created
    if (!activeRound || activeRound.status !== 'active') {
      activeRound = await db.collection('rounds').findOne(
        { tournament_id: new ObjectId(id), status: 'active' },
        { sort: { created_at: -1 } }
      );
    }

    const freshTournament = await db.collection('tournaments').findOne({ _id: new ObjectId(id) });
    const finalLatestSpin = await db.collection('spins').findOne(
      { round_id: activeRound?._id },
      { sort: { created_at: -1 } }
    );

    // Fetch history (last 25 spins across the entire tournament)
    const historySpins = await db.collection('spins')
        .find({ tournament_id: new ObjectId(id) })
        .sort({ created_at: -1 })
        .limit(25)
        .toArray();

    const history = historySpins.map(s => ({
      ...s.result,
      id: s._id.toString(),
      spin_number: s.spin_number,
      round_id: s.round_id?.toString()
    }));

    return NextResponse.json({
      ...(freshTournament || tournament),
      active_round: activeRound,
      latest_spin: finalLatestSpin,
      history,
      server_time: now,
      calculated_phase: phase,
      betting_deadline: bettingDeadline,
    });
  } catch (error: any) {
    console.error('Fetch tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { wheel_type } = await request.json();
    const db = await getDb();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (wheel_type !== 'american' && wheel_type !== 'european') {
      return NextResponse.json({ error: 'Invalid wheel type' }, { status: 400 });
    }

    const result = await db.collection('tournaments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { wheel_type } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, wheel_type });
  } catch (error: any) {
    console.error('Update tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
