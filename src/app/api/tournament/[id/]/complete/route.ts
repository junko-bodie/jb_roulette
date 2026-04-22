import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

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

    // 3. Update Tournament document
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

    // Update positions for final remaining players
    await db.collection('tournaments').updateOne(
      { _id: new ObjectId(id), "players.player_id": winner.player_id },
      { $set: { "players.$.final_position": 1, "players.$.status": "completed" } }
    );

    if (runnerUp) {
      await db.collection('tournaments').updateOne(
        { _id: new ObjectId(id), "players.player_id": runnerUp.player_id },
        { $set: { "players.$.final_position": 2, "players.$.status": "eliminated", "players.$.eliminated_round": 5 } }
      );
    }

    // 4. Points calculation (Example logic)
    // Points = (Rank bonus) + (Chips / 10)
    const playersWithPoints = tournament.players.map((p: any) => {
      const position = p.player_id.toString() === winner.player_id.toString() ? 1 : 
                       (runnerUp && p.player_id.toString() === runnerUp.player_id.toString()) ? 2 : 
                       (p.final_position || 6);
      
      const rankBonus = (7 - position) * 250; // Pos 1: 1500, Pos 2: 1250... Pos 6: 250
      const chipBonus = Math.floor(p.current_chips / 10);
      const totalPoints = rankBonus + chipBonus;
      
      return {
        player_id: p.player_id,
        username: p.username,
        is_bot: p.is_bot,
        position,
        total_points: totalPoints,
        final_chips: p.current_chips
      };
    });

    // Sort standings by final position
    const standings = playersWithPoints.sort((a: any, b: any) => a.position - b.position);

    return NextResponse.json({
      success: true,
      winner: {
        player_id: winner.player_id,
        username: winner.username,
        is_bot: winner.is_bot,
        chips: winner.current_chips
      },
      standings
    });

  } catch (error: any) {
    console.error('Tournament completion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
