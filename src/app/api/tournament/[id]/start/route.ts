import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { getUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { TournamentPlayer } from '@/lib/models/Tournament';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log(`Activating tournament: ${id}`);
    const db = await getDb();

    // 1. Fetch tournament
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'waiting') {
      return NextResponse.json({ 
        message: 'Tournament already started or completed',
        tournament 
      });
    }

    // 2. Fill remaining spots with bots
    const currentPlayers = tournament.players || [];
    const neededBots = Math.max(0, 6 - currentPlayers.length);
    
    if (neededBots > 0) {
      const bots: TournamentPlayer[] = Array.from({ length: neededBots }).map(() => {
        const botId = Math.floor(1000 + Math.random() * 9000);
        return {
          player_id: new ObjectId(),
          username: `Bot_${botId}`,
          avatar_url: '/avatars/bot.png',
          is_bot: true,
          starting_chips: 2000,
          current_chips: 2000,
          status: "active",
          eliminated_round: null,
          final_position: null,
          points_earned: null
        };
      });

      // 3. Update tournament: add bots and set status to active
      await db.collection('tournaments').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { status: 'active' },
          $push: { players: { $each: bots } }
        } as any
      );
    } else {
      // Just activate if already full
      await db.collection('tournaments').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'active' } }
      );
    }

    const updatedTournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    return NextResponse.json(updatedTournament);
  } catch (error: any) {
    console.error('Tournament start error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
