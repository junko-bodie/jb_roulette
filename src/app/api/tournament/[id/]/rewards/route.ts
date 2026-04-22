import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { TOURNAMENT_POINTS, BADGE_REQS } from '@/lib/tournament/points';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // 1. Fetch tournament
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tournament || tournament.status !== "completed") {
      return NextResponse.json({ error: 'Tournament not found or not completed' }, { status: 404 });
    }

    // 2. Find real player
    const realPlayerEntry = tournament.players.find((p: any) => !p.is_bot);
    if (!realPlayerEntry) {
      return NextResponse.json({ success: true, message: 'No real player in this tournament' });
    }

    const playerId = realPlayerEntry.player_id;
    const finalPosition = realPlayerEntry.final_position;

    // 3. Calculate points
    const basePoints = TOURNAMENT_POINTS[finalPosition] || 0;
    
    // 4. Update Profile document
    const player = await db.collection('user_profiles').findOne({ _id: new ObjectId(playerId) });
    if (!player) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isWinner = finalPosition === 1;
    const newStats = {
      tournaments_played: (player.stats?.tournaments_played || 0) + 1,
      tournaments_won: (player.stats?.tournaments_won || 0) + (isWinner ? 1 : 0),
      best_finish: Math.min(player.stats?.best_finish || 7, finalPosition)
    };

    const newSeasonPoints = (player.season?.points || 0) + basePoints;
    
    // Logic for badges
    const newBadges = {
      ...player.badges,
      champion: (player.badges?.champion || isWinner),
      elite_status: (player.badges?.elite_status || newSeasonPoints >= BADGE_REQS.ELITE_POINTS_THRESHOLD)
    };

    await db.collection('user_profiles').updateOne(
      { _id: new ObjectId(playerId) },
      {
        $set: {
          stats: newStats,
          badges: newBadges,
          season: {
            points: newSeasonPoints,
            year: new Date().getFullYear(),
            rank: player.season?.rank || 0
          }
        }
      }
    );

    // 5. Update Season Rankings
    const year = new Date().getFullYear();
    let rankingDoc = await db.collection('season_rankings').findOne({ year });

    if (!rankingDoc) {
      const newRanking = {
        year,
        rankings: [],
        updated_at: new Date()
      };
      const insertResult = await db.collection('season_rankings').insertOne(newRanking);
      rankingDoc = { ...newRanking, _id: insertResult.insertedId } as any;
    }

    const ranking = rankingDoc as any;

    // Update or add entry
    const entryIndex = ranking.rankings.findIndex((r: any) => r.player_id.toString() === playerId.toString());
    if (entryIndex >= 0) {
      ranking.rankings[entryIndex].points += basePoints;
      ranking.rankings[entryIndex].tournaments_played += 1;
      if (isWinner) ranking.rankings[entryIndex].tournaments_won += 1;
    } else {
      ranking.rankings.push({
        player_id: new ObjectId(playerId),
        username: player.username,
        points: basePoints,
        rank: 0,
        tournaments_played: 1,
        tournaments_won: isWinner ? 1 : 0
      });
    }

    // Recalculate ranks
    ranking.rankings.sort((a: any, b: any) => b.points - a.points);
    ranking.rankings.forEach((entry: any, idx: number) => {
      entry.rank = idx + 1;
    });

    await db.collection('season_rankings').updateOne(
      { year },
      {
        $set: {
          rankings: ranking.rankings,
          updated_at: new Date()
        }
      }
    );

    // Update player's individual season rank
    const myEntry = ranking.rankings.find((r: any) => r.player_id.toString() === playerId.toString());
    if (myEntry) {
      await db.collection('user_profiles').updateOne(
        { _id: new ObjectId(playerId) },
        { $set: { "season.rank": myEntry.rank } }
      );
    }

    return NextResponse.json({
      success: true,
      points_earned: basePoints,
      total_points: newSeasonPoints,
      badges: newBadges,
      stats: newStats,
      rank: myEntry?.rank || 0
    });

  } catch (error: any) {
    console.error('Rewards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
