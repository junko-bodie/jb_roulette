import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { getUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { Tournament, TournamentPlayer } from '@/lib/models/Tournament';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get user profile for details
    const profile = await db.collection('user_profiles').findOne({ supabase_id: user.id });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generate 5 bots
    const bots: TournamentPlayer[] = Array.from({ length: 5 }).map(() => {
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

    const players: TournamentPlayer[] = [
      {
        player_id: profile._id,
        username: profile.name || profile.username || 'Player',
        avatar_url: profile.avatar_url || '/avatars/default.png',
        is_bot: false,
        starting_chips: 2000,
        current_chips: 2000,
        status: "active",
        eliminated_round: null,
        final_position: null,
        points_earned: null
      },
      ...bots
    ];

    const tournament: Tournament = {
      status: "active", // User requested active immediately
      created_at: new Date(),
      current_round: 1,
      winner_id: null,
      players: players
    };

    const result = await db.collection('tournaments').insertOne(tournament as any);
    const createdTournament = { ...tournament, _id: result.insertedId };

    return NextResponse.json(createdTournament);
  } catch (error: any) {
    console.error('Tournament creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
