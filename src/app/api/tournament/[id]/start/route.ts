import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { getUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { TournamentPlayer } from '@/lib/models/Tournament';
import { generateAllRoundBotBets } from '@/lib/tournament/serverBotBetting';
import { getRandomBotName } from '@/lib/tournament/botNames';

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

    // 1. Fetch tournament and user profile
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const profile = await db.collection('user_profiles').findOne({ supabase_id: user.id });
    const hasChampionBadge = profile?.badges?.champion || false;

    if (tournament.status !== 'waiting') {
      return NextResponse.json({ 
        message: 'Tournament already started or completed',
        tournament 
      });
    }

    // Update real player's badge status in the tournament players list
    await db.collection('tournaments').updateOne(
      { 
        _id: new ObjectId(id),
        "players.player_id": profile?._id || new ObjectId(user.id) // Fallback if ID is different
      },
      { $set: { "players.$.has_champion_badge": hasChampionBadge } }
    );

    // 2. Fill remaining spots with bots
    const currentPlayers = tournament.players || [];
    const neededBots = Math.max(0, 6 - currentPlayers.length);
    
    if (neededBots > 0) {
      const usedNames: string[] = [];
      const bots: TournamentPlayer[] = Array.from({ length: neededBots }).map(() => {
        const botName = getRandomBotName(usedNames);
        usedNames.push(botName);
        
        // Randomly give bots a crown to make the competition feel "elite" (1 in 10 bots)
        const botHasChampionBadge = Math.random() < 0.1;

        return {
          player_id: new ObjectId(),
          username: botName,
          avatar_url: '/avatars/bot.png',
          is_bot: true,
          starting_chips: 2000,
          current_chips: 2000,
          status: "active",
          eliminated_round: null,
          final_position: null,
          points_earned: null,
          has_champion_badge: botHasChampionBadge
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

    // 4. Automatically create the first round
    const tournamentForRound = await db.collection('tournaments').findOne({ _id: new ObjectId(id) });
    if (tournamentForRound) {
       // Generate bot bets for all 5 spins of this round
       const activeBots = tournamentForRound.players.filter((p: any) => p.is_bot && p.status === "active");
       const allBotBets: any[] = [];
       activeBots.forEach((bot: any) => {
         const bets = generateAllRoundBotBets(bot);
         allBotBets.push(...bets);
       });

       const now = new Date();
       const round = {
         tournament_id: new ObjectId(id),
         round_number: 1,
         status: "active",
         spins_completed: 0,
         players_remaining: tournamentForRound.players
           .filter((p: any) => p.status === "active")
           .map((p: any) => p.player_id),
         eliminated_player_id: null,
         created_at: now,
         last_spin_completed_at: now,
         betting_ends_at: new Date(now.getTime() + 45000), // Exactly 45 second betting window
         completed_at: null,
         bot_bets: allBotBets
       };
       await db.collection('rounds').insertOne(round as any);
       console.log(`[Tournament Start] Created first round with ${allBotBets.length} bot bets for tournament ${id}`);
    }

    const updatedTournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    const activeRound = await db.collection('rounds').findOne({
      tournament_id: new ObjectId(id),
      status: "active"
    }, { sort: { created_at: -1 } });

    return NextResponse.json({
      ...updatedTournament,
      active_round: activeRound
    });
  } catch (error: any) {
    console.error('Tournament start error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
