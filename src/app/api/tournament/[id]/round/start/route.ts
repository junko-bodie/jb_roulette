import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { generateAllRoundBotBets } from '@/lib/tournament/serverBotBetting';

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

    // Check if an active round already exists for this tournament
    const existingRound = await db.collection('rounds').findOne({
      tournament_id: new ObjectId(id),
      status: "active"
    }, { sort: { created_at: -1 } });

    if (existingRound) {
      console.log(`[Round Start] Returning existing active round for tournament ${id}`);
      return NextResponse.json(existingRound);
    }

    console.log(`[Round Start] Creating new round ${roundNumber} for tournament ${id}`);
    // Generate bot bets for all 5 spins of this round
    const activeBots = tournament.players.filter((p: any) => p.is_bot && p.status === "active");
    const allBotBets: any[] = [];
    activeBots.forEach((bot: any) => {
      const bets = generateAllRoundBotBets(bot);
      allBotBets.push(...bets);
    });

    const now = new Date();
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
      created_at: now,
      betting_ends_at: new Date(now.getTime() + 30000), // Exactly 30 second betting window
      completed_at: null,
      bot_bets: allBotBets
    };

    const result = await db.collection('rounds').insertOne(round as any);
    const createdRound = { ...round, _id: result.insertedId };

    return NextResponse.json(createdRound);
  } catch (error: any) {
    console.error('Start round error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
