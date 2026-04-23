import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, roundId: string }> }
) {
  try {
    const { id, roundId } = await params;
    const db = await getDb();
    
    // 1. Fetch current tournament and round
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    const activeRound = await db.collection('rounds').findOne({ 
      _id: new ObjectId(roundId) 
    });

    if (!tournament || !activeRound) {
      return NextResponse.json({ error: 'Tournament or Round not found' }, { status: 404 });
    }

    // IDEMPOTENCY: If round is already completed, return existing data
    if (activeRound.status === "completed") {
      const eliminatedPlayer = tournament.players.find((p: any) => p.player_id.toString() === activeRound.eliminated_player_id?.toString());
      return NextResponse.json({
        success: true,
        eliminatedPlayer: eliminatedPlayer ? {
          player_id: eliminatedPlayer.player_id,
          username: eliminatedPlayer.username,
          is_bot: eliminatedPlayer.is_bot,
          final_chips: eliminatedPlayer.current_chips,
          position: eliminatedPlayer.final_position
        } : null,
        nextRound: tournament.current_round,
        alreadyCompleted: true
      });
    }

    const currentRound = tournament.current_round || 1;
    const activePlayers = tournament.players.filter((p: any) => p.status === "active");

    if (activePlayers.length <= 1) {
      return NextResponse.json({ error: 'Not enough active players to eliminate' }, { status: 400 });
    }

    // 2. Identify the player to eliminate
    // Logic: Lowest chips first. If chips are equal, higher array index wins (gets eliminated).
    
    // We need to keep track of original indices to resolve ties
    const activePlayersWithIndex = activePlayers.map((player: any) => {
      const originalIndex = tournament.players.findIndex((p: any) => p.player_id.toString() === player.player_id.toString());
      return { ...player, originalIndex };
    });

    activePlayersWithIndex.sort((a: any, b: any) => {
      if (a.current_chips !== b.current_chips) {
        return a.current_chips - b.current_chips; // Sort by chips ascending
      }
      return b.originalIndex - a.originalIndex; // Tie-break: higher original index first
    });

    const playerToEliminate = activePlayersWithIndex[0];
    const finalPosition = 7 - currentRound; // Round 1 -> 6, Round 2 -> 5, Round 3 -> 4, Round 4 -> 3

    // 3. Update Tournament document
    await db.collection('tournaments').updateOne(
      { 
        _id: new ObjectId(id),
        "players.player_id": playerToEliminate.player_id
      },
      {
        $set: {
          "players.$.status": "eliminated",
          "players.$.eliminated_round": currentRound,
          "players.$.final_position": finalPosition
        },
        $inc: { current_round: 1 }
      }
    );

    // 4. Update Round document
    await db.collection('rounds').updateOne(
      { _id: new ObjectId(roundId) },
      {
        $set: {
          eliminated_player_id: playerToEliminate.player_id,
          status: "completed",
          completed_at: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      eliminatedPlayer: {
        player_id: playerToEliminate.player_id,
        username: playerToEliminate.username,
        is_bot: playerToEliminate.is_bot,
        final_chips: playerToEliminate.current_chips,
        position: finalPosition
      },
      nextRound: currentRound + 1
    });

  } catch (error: any) {
    console.error('Elimination error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
