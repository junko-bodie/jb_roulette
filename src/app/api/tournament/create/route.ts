import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { getUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { Tournament, TournamentPlayer } from '@/lib/models/Tournament';

export async function POST() {
  try {
    let user = await getUser();
    
    const db = await getDb();
    let profile: any = null;

    if (!user) {
      // Fallback for development/offline testing: look for a guest profile or the first profile
      console.warn('[Tournament API] No active Supabase session. Attempting guest/dev mode...');
      profile = await db.collection('user_profiles').findOne({ name: 'Player' }); 
      if (!profile) {
        // Create a default profile for local testing/guest mode
        const newProfile = {
          name: 'Player',
          balance: 1000.00,
          starting_balance: 1000,
          is_sound_enabled: true,
          is_timer_enabled: true,
          is_popup_enabled: true,
          stats: { tournaments_played: 0, tournaments_won: 0, best_finish: 0 },
          badges: { champion: false, elite_status: false, all_time_champion: false },
          season: { year: new Date().getFullYear(), points: 0, rank: 0 },
          created_at: new Date(),
          updated_at: new Date(),
          provider: 'guest'
        };
        const result = await db.collection('user_profiles').insertOne(newProfile as any);
        profile = { ...newProfile, _id: result.insertedId };
        console.log('[Tournament API] Created default guest profile');
      }
    } else {
      // Ensure user profile exists for authenticated users
      const { ensureUserProfile } = await import('@/lib/auth');
      profile = await ensureUserProfile(user);
    }

    if (!profile) {
      console.error('[Tournament API] Profile not found for user:', user?.id || 'Guest');
      return NextResponse.json({ error: 'Profile not found. Please refresh your session.' }, { status: 404 });
    }

    console.log('[Tournament API] Creating/Joining tournament for player:', profile.name, profile._id);

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
      console.log('[Tournament API] Found existing tournament:', tournament._id);
      // Join existing tournament - with concurrency check to not exceed 6 players
      const updateResult = await db.collection('tournaments').updateOne(
        { _id: tournament._id, "players.5": { $exists: false } },
        { $push: { players: currentPlayer as any } }
      );
      
      if (updateResult.modifiedCount === 0) {
        console.log('[Tournament API] Tournament filled up, creating new one');
        // Someone else filled it in the meantime, create a new one instead
        const newTournament: Tournament = {
          status: "waiting",
          created_at: new Date(),
          current_round: 1,
          winner_id: null,
          players: [currentPlayer],
          wheel_type: 'american'
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
        console.log('[Tournament API] Creating new tournament');
        // Create new tournament in waiting status
        const newTournament: Tournament = {
          status: "waiting",
          created_at: new Date(),
          current_round: 1,
          winner_id: null,
          players: [currentPlayer],
          wheel_type: 'american'
        };

        const result = await db.collection('tournaments').insertOne(newTournament as any);
        tournament = { ...newTournament, _id: result.insertedId } as any;
      } else {
        console.log('[Tournament API] Player already in waiting tournament:', tournament._id);
      }
    }

    return NextResponse.json(tournament);
  } catch (error: any) {
    console.error('Tournament join/create error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

