import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

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

    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const activeRound = await db.collection('rounds').findOne({ 
      tournament_id: new ObjectId(id),
      status: "active"
    }, { sort: { created_at: -1 } });

    const latestSpin = await db.collection('spins').findOne({
      tournament_id: new ObjectId(id)
    }, { sort: { created_at: -1 } });

    const now = Date.now();
    let phase = tournament.status === "active" ? "betting" : "waiting";
    let bettingDeadline = 0;

    // AUTO-START WATCHDOG: If waiting for > 65s, start the tournament automatically
    if (tournament.status === 'waiting' && tournament.created_at) {
      const created = new Date(tournament.created_at).getTime();
      if (now > created + 65000) { 
        console.log(`[Auto-Start] Tournament ${id} lobby time expired. Activating...`);
        // We could call the internal logic of the start route, or just set status here.
        // For simplicity and safety, we trigger it via an internal-like call logic.
        await db.collection('tournaments').updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'active' } }
        );
        // Note: The first round will be created by the next poll's startRound trigger or the next client poll.
        phase = "betting";
      }
    }
    
    if (tournament.status === "active" && activeRound) {
      if (activeRound.spins_completed >= 5) {
        phase = "elimination";
      } else {
        bettingDeadline = activeRound.betting_ends_at ? new Date(activeRound.betting_ends_at).getTime() : 0;
        
        if (bettingDeadline > 0 && now > bettingDeadline) {
          phase = "locked";
        }

        const spinToLookFor = activeRound.spins_completed + 1;
        const inProgressSpin = (latestSpin && 
                               latestSpin.round_id.toString() === activeRound._id.toString() && 
                               latestSpin.spin_number === spinToLookFor) ? latestSpin : null;
                               
        const latestResult = inProgressSpin || activeRound.spin_results?.find((r: any) => r.spin_number === spinToLookFor - 1);
        
        if (latestResult) {
          const resultTime = new Date(latestResult.created_at).getTime();
          // Normalized Timing: Spinning (10s), Result (10s). Betting starts after 20s.
          if (now < resultTime + 10000) {
            phase = "spinning";
          } else if (now < resultTime + 20000) {
            phase = "result";
          }
        }
      }

      // AUTO-SPIN FALLBACK: If stuck at locked for > 3s, trigger recovery
      if (phase === "locked" && now > bettingDeadline + 3000) {
        console.log(`[Auto-Spin] Tournament ${id} is stuck. Triggering recovery...`);
        const spinToLookFor = activeRound.spins_completed + 1;
        
        const existing = await db.collection('spins').findOne({
          tournament_id: new ObjectId(id),
          round_id: activeRound._id,
          spin_number: spinToLookFor
        });

        if (!existing) {
          const pockets = tournament.wheel_type === 'european' ? 
             [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26] :
             [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 37, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
          
          const num = pockets[Math.floor(Math.random() * pockets.length)];
          const result = { number: num, displayNumber: num === 37 ? '00' : num.toString(), created_at: new Date() };
          
          const activePlayers = (tournament.players || []).filter((p: any) => p.status === "active");
          const playerResults = activePlayers.map((p: any) => {
            const bets = p.is_bot 
              ? (activeRound.bot_bets || []).filter((b: any) => b.player_id.toString() === p.player_id.toString() && b.spin_number === spinToLookFor)
              : (p.pending_bets || []);
            
            return {
              player_id: p.player_id,
              username: p.username,
              is_bot: p.is_bot,
              bets_placed: bets,
              chips_before: p.current_chips,
              chips_after: p.current_chips,
              won: 0
            };
          });

          await db.collection('spins').insertOne({
            tournament_id: new ObjectId(id),
            round_id: activeRound._id,
            spin_number: spinToLookFor,
            result,
            player_results: playerResults,
            created_at: new Date(),
            is_auto_recovery: true
          });

          await db.collection('rounds').updateOne(
            { _id: activeRound._id },
            { 
              $inc: { spins_completed: 1 },
              $set: { 
                betting_ends_at: spinToLookFor < 5 ? new Date(Date.now() + 50000) : null,
                last_spin_completed_at: new Date()
              }
            }
          );
          
          phase = 'spinning';
        }
      }

      // AUTO-ELIMINATION WATCHDOG: If in elimination phase for > 30s, automate progression
      if (phase === "elimination" && latestSpin) {
        const spinTime = new Date(latestSpin.created_at).getTime();
        if (now > spinTime + 30000) { 
          console.log(`[Auto-Elimination] Tournament ${id} is ready for Round ${tournament.current_round + 1}.`);
          
          const activePlayers = (tournament.players || []).filter((p: any) => p.status === "active");
          if (activePlayers.length > 1) {
            const activePlayersWithIndex = activePlayers.map((player: any) => {
              const originalIndex = tournament.players.findIndex((p: any) => p.player_id.toString() === player.player_id.toString());
              return { ...player, originalIndex };
            });

            activePlayersWithIndex.sort((a: any, b: any) => {
              if (a.current_chips !== b.current_chips) return a.current_chips - b.current_chips;
              return b.originalIndex - a.originalIndex;
            });

            const playerToEliminate = activePlayersWithIndex[0];
            const currentRound = tournament.current_round || 1;
            const finalPosition = 7 - currentRound;

            await db.collection('tournaments').updateOne(
              { _id: new ObjectId(id), "players.player_id": playerToEliminate.player_id },
              {
                $set: {
                  "players.$.status": "eliminated",
                  "players.$.eliminated_round": currentRound,
                  "players.$.final_position": finalPosition
                },
                $inc: { current_round: 1 }
              }
            );

            await db.collection('rounds').updateOne(
              { _id: activeRound._id },
              { $set: { eliminated_player_id: playerToEliminate.player_id, status: "completed", completed_at: new Date() } }
            );
            
            phase = "betting";
          }
        }
      }

      // AUTO-WINNER WATCHDOG: If only 1 player remains active, declare winner
      const totalActive = (tournament.players || []).filter((p: any) => p.status === "active");
      if (totalActive.length === 1 && tournament.status === "active") {
         const winner = totalActive[0];
         console.log(`[Auto-Winner] Tournament ${id} completed. Winner: ${winner.username}`);
         await db.collection('tournaments').updateOne(
           { _id: new ObjectId(id) },
           { 
             $set: { 
               status: "completed", 
               winner_id: winner.player_id,
               completed_at: new Date()
             } 
           }
         );
         phase = "completed";
      }
    }

    if (tournament.status === "completed") {
      phase = "completed";
    }

    return NextResponse.json({
      ...tournament,
      active_round: activeRound,
      latest_spin: latestSpin,
      server_time: now,
      calculated_phase: phase,
      betting_deadline: phase === "betting" ? bettingDeadline - 20000 : bettingDeadline
    });
  } catch (error: any) {
    console.error('Fetch tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
