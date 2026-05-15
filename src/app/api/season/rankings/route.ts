import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const year = new Date().getFullYear();
    
    const rankingDoc = await db.collection('season_rankings').findOne({ year });
    
    if (!rankingDoc) {
      return NextResponse.json({ 
        year, 
        rankings: [], 
        updated_at: new Date() 
      });
    }

    const rankings = rankingDoc.rankings || [];
    
    // Fetch latest profiles to get up-to-date usernames and avatars
    const playerIds = rankings.map((r: any) => r.player_id);
    const profiles = await db.collection('user_profiles')
      .find({ _id: { $in: playerIds } })
      .project({ _id: 1, username: 1, avatar_url: 1 })
      .toArray();
    
    const profileMap = new Map(profiles.map(p => [p._id.toString(), p]));

    // Merge latest profile data into rankings
    const enrichedRankings = rankings.map((r: any) => {
      const profile = profileMap.get(r.player_id.toString());
      return {
        ...r,
        username: profile?.username || r.username || 'Anonymous Contender',
        avatar_url: profile?.avatar_url || r.avatar_url
      };
    });

    // Sort by points descending
    enrichedRankings.sort((a: any, b: any) => b.points - a.points);

    return NextResponse.json({
      year: rankingDoc.year,
      rankings: enrichedRankings,
      updated_at: rankingDoc.updated_at
    });
  } catch (error: any) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
