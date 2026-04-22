import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { player_id, bets } = body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(player_id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = await getDb();
    
    // Update the pending_bets for the specific player in this tournament
    const result = await db.collection('tournaments').updateOne(
      { 
        _id: new ObjectId(id),
        "players.player_id": new ObjectId(player_id)
      },
      { 
        $set: { "players.$.pending_bets": bets } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Player or Tournament not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Bet sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
