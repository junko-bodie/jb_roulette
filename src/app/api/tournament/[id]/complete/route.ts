import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { awardTournamentRewards } from '@/lib/tournament/rewards';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // 1. Fetch current tournament
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const activePlayers = tournament.players.filter((p: any) => p.status === "active");

    // 2. Determine Winner from remaining players
    // Sort logic: higher chips first.
    // Ties: Real player > Bot. Both bots: lower original index first.
    
    const candidates = activePlayers.map((player: any) => {
      const originalIndex = tournament.players.findIndex((p: any) => p.player_id.toString() === player.player_id.toString());
      return { ...player, originalIndex };
    });

    candidates.sort((a: any, b: any) => {
      if (a.current_chips !== b.current_chips) {
        return b.current_chips - a.current_chips; // Higher chips first
      }
      
      // Tie-break: Real player first
      if (!a.is_bot && b.is_bot) return -1;
      if (a.is_bot && !b.is_bot) return 1;
      
      // Both bots: Lower index first
      return a.originalIndex - b.originalIndex;
    });

    const winner = candidates[0];
    const runnerUp = candidates[1];

    // 3. Update all candidates with their final positions
    const bulkUpdateOps = candidates.map((p: any, index: number) => ({
      updateOne: {
        filter: { _id: new ObjectId(id), "players.player_id": p.player_id },
        update: { 
          $set: { 
            "players.$.final_position": index + 1, 
            "players.$.status": index === 0 ? "completed" : "eliminated",
            "players.$.eliminated_round": 5
          } 
        }
      }
    }));

    if (bulkUpdateOps.length > 0) {
      await db.collection('tournaments').bulkWrite(bulkUpdateOps);
    }

    // 4. Update Tournament document global state
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

    const results = await awardTournamentRewards(id);

    return NextResponse.json({
      success: true,
      winner: results?.winner,
      standings: results?.standings
    });

  } catch (error: any) {
    console.error('Tournament completion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
