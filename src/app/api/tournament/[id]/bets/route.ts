import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = await getDb();
    
    // Fetch only the players array to get pending_bets
    const tournament = await db.collection('tournaments').findOne(
      { _id: new ObjectId(id) },
      { projection: { players: 1 } }
    );

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Map players to a simpler structure containing their pending bets
    const playersBets = (tournament.players || []).map((p: any) => ({
      player_id: p.player_id,
      username: p.username,
      pending_bets: p.pending_bets || [],
      is_bot: p.is_bot
    }));

    return NextResponse.json({ bets: playersBets });
  } catch (error: any) {
    console.error('Fetch bets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    
    // Update the specific player's pending_bets field
    await db.collection('tournaments').updateOne(
      { 
        _id: new ObjectId(id), 
        "players.player_id": new ObjectId(player_id) 
      },
      { 
        $set: { "players.$.pending_bets": bets } 
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update bets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
