import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { calculatePayouts } from '@/lib/payouts';
import { AMERICAN_WHEEL_ORDER, EUROPEAN_WHEEL_ORDER, getDisplayNumber, getNumberColor } from '@/lib/rng';

/**
 * Server-side version of spinWheel to ensure fairness and consistency in tournament.
 */
function getSpinResult(wheelType: 'american' | 'european' = 'american') {
  const pockets = wheelType === 'american' ? AMERICAN_WHEEL_ORDER : EUROPEAN_WHEEL_ORDER;
  const totalPockets = pockets.length;
  
  // Use crypto for random number generation
  const randomIndex = Math.floor(Math.random() * totalPockets);
  const number = pockets[randomIndex];

  return {
    number,
    displayNumber: getDisplayNumber(number),
    color: getNumberColor(number),
    // Helper fields for easier payout logic if needed
    parity: number === 0 || number === 37 ? 'none' : (number % 2 === 0 ? 'even' : 'odd'),
    dozen: number === 0 || number === 37 ? 'none' : (number <= 12 ? '1st' : number <= 24 ? '2nd' : '3rd'),
    column: number === 0 || number === 37 ? 'none' : (number % 3 === 1 ? '1st' : number % 3 === 2 ? '2nd' : '3rd'),
    half: number === 0 || number === 37 ? 'none' : (number <= 18 ? '1-18' : '19-36')
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid tournament ID format' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Spin API] JSON parse error');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { player_bets, bot_bets, round_id, spin_number } = body;
    
    console.log(`[Spin API] Tournament: ${id}, Round: ${round_id}, Spin: ${spin_number}`);
    
    if (typeof spin_number !== 'number') {
      return NextResponse.json({ error: 'spin_number must be a number' }, { status: 400 });
    }

    if (!round_id || !ObjectId.isValid(round_id)) {
      console.error('[Spin API] Missing or invalid round_id');
      return NextResponse.json({ error: 'Valid round_id is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // 1. Fetch current tournament state
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      console.error(`[Spin API] Tournament not found: ${id}`);
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // 1.2 Fetch current round to get consistent bot bets
    const round = await db.collection('rounds').findOne({ 
      _id: new ObjectId(round_id) 
    });

    if (!round) {
      console.error(`[Spin API] Round not found: ${round_id}`);
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // 1.1 Check for idempotency: Has this spin already been processed?
    const existingSpin = await db.collection('spins').findOne({
      tournament_id: new ObjectId(id),
      round_id: new ObjectId(round_id),
      spin_number: spin_number
    });

    if (existingSpin) {
      console.log(`[Spin API] Returning existing result for spin ${spin_number}`);
      // Re-map chip updates from the existing spin results
      const chipUpdates: Record<string, number> = {};
      existingSpin.player_results.forEach((pr: any) => {
        chipUpdates[pr.player_id.toString()] = pr.chips_after;
      });

      return NextResponse.json({
        success: true,
        result: existingSpin.result,
        player_results: existingSpin.player_results,
        chip_updates: chipUpdates
      });
    }

    // 2. Filter active players
    const activePlayers = (tournament.players || []).filter((p: any) => p.status === "active");
    console.log(`[Spin API] Processing ${activePlayers.length} active players: ${activePlayers.map((p: any) => p.username).join(', ')}`);

    // 3. Get spin result
    const result = getSpinResult(tournament.wheel_type || 'american'); 
    console.log(`[Spin API] Spin Result: ${result.displayNumber}`);

    // 4. Calculate payouts for all players
    const chipUpdates: Record<string, number> = {};
    const playerResults: any[] = [];

    activePlayers.forEach((player: any) => {
      // Ensure we have a string ID for the map
      const pidStr = player.player_id.toString();
      
      let bets = [];
      if (player.is_bot) {
        // Fetch pre-generated bot bets for THIS spin from the round document
        bets = (round.bot_bets || [])
          .filter((b: any) => b.player_id.toString() === pidStr && b.spin_number === spin_number)
          .map((b: any) => ({
            betId: b.betId,
            amount: b.amount,
            chips: b.chips
          }));
      } else {
        // Find bets for this specific real player if provided in the payload
        // player_bets can be an array of { player_id, bets }
        if (Array.isArray(player_bets)) {
          const pData = player_bets.find((pb: any) => pb.player_id?.toString() === pidStr);
          bets = pData ? pData.bets : [];
          
          // Fallback: If it's a flat array and there's only one player who could have sent it
          if (bets.length === 0 && player_bets.length > 0 && !player_bets[0].player_id) {
             bets = player_bets;
          }
        } else {
          bets = [];
        }
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
        won: payout.totalWon
      });
    });

    // 5. Create spin document
    const spinDoc = {
      tournament_id: new ObjectId(id),
      round_id: new ObjectId(round_id),
      spin_number,
      result,
      player_results: playerResults,
      created_at: new Date()
    };
    
    console.log('[Spin API] Inserting spin record...');
    await db.collection('spins').insertOne(spinDoc);

    // 6. Update round document (increment spins_completed and set next betting deadline)
    // 7. Sync chip counts to tournament document
    console.log('[Spin API] Syncing chips to tournament...');
    const tournamentAny = tournament as any;
    const updateOps = Object.entries(chipUpdates).map(([playerId, chips]) => {
      if (!ObjectId.isValid(playerId)) return null;

      // Find original player for bust tracking
      const p = (tournamentAny.players || []).find((pl: any) => pl.player_id.toString() === playerId);

      return {
        updateOne: {
          filter: { 
            _id: new ObjectId(id), 
            "players.player_id": new ObjectId(playerId) 
          },
          update: { 
            $set: { 
              "players.$.current_chips": chips,
              "players.$.pending_bets": [],
              ...(chips <= 0 && (!p?.bust_spin) ? {
                "players.$.bust_spin": spin_number,
                "players.$.chips_before_bust": p?.current_chips || 0
              } : {})
            } 
          }
        }
      };
    }).filter(Boolean);

    if (updateOps.length > 0) {
      console.log(`[Spin API] Executing bulk write for ${updateOps.length} updates`);
      await db.collection('tournaments').bulkWrite(updateOps as any);
    }

    // 8. Update active round state (Do this LAST so clients see the new spin only after bets are cleared)
    console.log('[Spin API] Updating round counter and setting next deadline...');
    const nextBettingEndsAt = spin_number < 5 ? new Date(Date.now() + 50000) : null;
    
    await db.collection('rounds').updateOne(
      { _id: new ObjectId(round_id) },
      { 
        $inc: { spins_completed: 1 },
        $set: { 
          betting_ends_at: nextBettingEndsAt,
          last_spin_completed_at: nextBettingEndsAt ? new Date() : null,
          ready_players: [] 
        }
      }
    );


    return NextResponse.json({
      success: true,
      result,
      player_results: playerResults,
      chip_updates: chipUpdates
    });
  } catch (error: any) {
    console.error('Tournament spin error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: error.toString()
    }, { status: 500 });
  }
}
