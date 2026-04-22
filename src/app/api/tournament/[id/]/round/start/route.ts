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
    
    // Get current tournament to find current round number
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const roundNumber = tournament.current_round || 1;

    // Create a new round document
    const round = {
      tournament_id: new ObjectId(id),
      round_number: roundNumber,
      status: "active",
      spins_completed: 0,
      players_remaining: tournament.players
        .filter((p: any) => p.status === "active")
        .map((p: any) => p.player_id),
      eliminated_player_id: null,
      created_at: new Date(),
      completed_at: null
    };

    const result = await db.collection('rounds').insertOne(round);
    const createdRound = { ...round, _id: result.insertedId };

    return NextResponse.json(createdRound);
  } catch (error: any) {
    console.error('Start round error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
