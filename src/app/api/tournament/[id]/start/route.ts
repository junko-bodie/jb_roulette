import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { getUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { TournamentPlayer } from '@/lib/models/Tournament';
import { generateAllRoundBotBets } from '@/lib/tournament/serverBotBetting';

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
         betting_ends_at: new Date(now.getTime() + 30000), // Exactly 30 second betting window
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
