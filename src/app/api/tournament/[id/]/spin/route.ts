import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { generateBotBets } from '@/lib/tournament/botBetting';
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
    const { player_bets, round_id, spin_number } = await request.json();
    
    if (!round_id) {
      return NextResponse.json({ error: 'round_id is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // 1. Fetch current tournament state
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // 2. Generate bot bets
    const playerResults: any[] = [];
    const activePlayers = tournament.players.filter((p: any) => p.status === "active");

    // 3. Get spin result
    const result = getSpinResult('american'); // Tournament uses American wheel

    // 4. Calculate payouts for all players
    const chipUpdates: Record<string, number> = {};

    activePlayers.forEach((player: any) => {
      let bets = [];
      if (player.is_bot) {
        bets = generateBotBets(player);
      } else {
        bets = player_bets || [];
      }

      const payout = calculatePayouts(bets, result as any);
      const newChips = player.current_chips + payout.netResult;
      
      chipUpdates[player.player_id.toString()] = newChips;

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
    await db.collection('spins').insertOne(spinDoc);

    // 6. Update round document (increment spins_completed)
    await db.collection('rounds').updateOne(
      { _id: new ObjectId(round_id) },
      { $inc: { spins_completed: 1 } }
    );

    // 7. Sync chip counts to tournament document
    const updateOps = Object.entries(chipUpdates).map(([playerId, chips]) => ({
      updateOne: {
        filter: { 
          _id: new ObjectId(id), 
          "players.player_id": new ObjectId(playerId) 
        },
        update: { 
          $set: { "players.$.current_chips": chips } 
        }
      }
    }));

    if (updateOps.length > 0) {
      await db.collection('tournaments').bulkWrite(updateOps);
    }

    return NextResponse.json({
      success: true,
      result,
      player_results: playerResults,
      chip_updates: chipUpdates
    });
  } catch (error: any) {
    console.error('Tournament spin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
