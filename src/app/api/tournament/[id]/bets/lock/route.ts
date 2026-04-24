import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { player_id, bets, round_id } = body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(player_id) || !ObjectId.isValid(round_id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = await getDb();
    
    // First, sync their final bets
    await db.collection('tournaments').updateOne(
      { 
        _id: new ObjectId(id),
        "players.player_id": new ObjectId(player_id)
      },
      { 
        $set: { "players.$.pending_bets": bets } 
      }
    );

    // Then, mark them as ready in the active round
    const result = await db.collection('rounds').updateOne(
      { _id: new ObjectId(round_id) },
      { $addToSet: { ready_players: player_id } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Bet lock error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
