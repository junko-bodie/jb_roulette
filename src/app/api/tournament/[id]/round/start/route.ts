import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { generateAllRoundBotBets } from '@/lib/tournament/serverBotBetting';

const BETTING_DURATION = 45000; // ms

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const tournament = await db.collection('tournaments').findOne({ _id: new ObjectId(id) });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const roundNumber = tournament.current_round || 1;

    // ── Idempotency: return existing active round if any ──
    const existingRound = await db.collection('rounds').findOne({
      tournament_id: new ObjectId(id),
      status: 'active',
    }, { sort: { created_at: -1 } });

    if (existingRound) {
      console.log(`[Round Start] Returning existing active round ${existingRound._id}`);
      return NextResponse.json(existingRound);
    }

    // Also guard against duplicate round_number for this tournament
    const duplicateRound = await db.collection('rounds').findOne({
      tournament_id: new ObjectId(id),
      round_number: roundNumber,
    });

    if (duplicateRound) {
      console.log(`[Round Start] Round ${roundNumber} already exists (status: ${duplicateRound.status}). Returning.`);
      return NextResponse.json(duplicateRound);
    }

    // ── Clear pending bets from previous round ──
    await db.collection('tournaments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { 'players.$[].pending_bets': [] } }
    );

    // ── Generate bot bets for all 5 spins ──
    const activeBots = (tournament.players || []).filter((p: any) => p.is_bot && p.status === 'active');
    const allBotBets: any[] = [];
    activeBots.forEach((bot: any) => allBotBets.push(...generateAllRoundBotBets(bot)));

    const now = new Date();
    const round = {
      tournament_id: new ObjectId(id),
      round_number: roundNumber,
      status: 'active',
      spins_completed: 0,
      players_remaining: (tournament.players || [])
        .filter((p: any) => p.status === 'active')
        .map((p: any) => p.player_id),
      eliminated_player_id: null,
      created_at: now,
      last_spin_completed_at: now,
      betting_ends_at: new Date(now.getTime() + BETTING_DURATION),
      completed_at: null,
      bot_bets: allBotBets,
    };

    console.log(`[Round Start] Creating round ${roundNumber} for tournament ${id}`);
    const result = await db.collection('rounds').insertOne(round as any);
    return NextResponse.json({ ...round, _id: result.insertedId });
  } catch (error: any) {
    console.error('Start round error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
