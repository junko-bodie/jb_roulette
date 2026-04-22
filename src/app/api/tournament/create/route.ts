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

    const currentPlayer: TournamentPlayer = {
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
    };

    // 1. Try to find an existing tournament in 'waiting' status with space
    // and where the player is not already present
    let tournament = await db.collection('tournaments').findOne({
      status: "waiting",
      "players.5": { $exists: false }, // Fewer than 6 players
      "players.player_id": { $ne: profile._id } // Not already in it
    });

    if (tournament) {
      // Join existing tournament - with concurrency check to not exceed 6 players
      const updateResult = await db.collection('tournaments').updateOne(
        { _id: tournament._id, "players.5": { $exists: false } },
        { $push: { players: currentPlayer as any } }
      );
      
      if (updateResult.modifiedCount === 0) {
        // Someone else filled it in the meantime, create a new one instead
        const newTournament: Tournament = {
          status: "waiting",
          created_at: new Date(),
          current_round: 1,
          winner_id: null,
          players: [currentPlayer]
        };

        const result = await db.collection('tournaments').insertOne(newTournament as any);
        tournament = { ...newTournament, _id: result.insertedId } as any;
      } else {
        tournament = await db.collection('tournaments').findOne({ _id: tournament._id });
      }
    } else {
      // Check if player is already in a waiting tournament but we missed it (e.g. joined alone)
      tournament = await db.collection('tournaments').findOne({
        status: "waiting",
        "players.player_id": profile._id
      });

      if (!tournament) {
        // Create new tournament in waiting status
        const newTournament: Tournament = {
          status: "waiting",
          created_at: new Date(),
          current_round: 1,
          winner_id: null,
          players: [currentPlayer]
        };

        const result = await db.collection('tournaments').insertOne(newTournament as any);
        tournament = { ...newTournament, _id: result.insertedId } as any;
      }
    }

    return NextResponse.json(tournament);
  } catch (error: any) {
    console.error('Tournament join/create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
