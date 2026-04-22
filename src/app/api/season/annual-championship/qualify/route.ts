import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    // 1. Fetch final rankings for current year
    const rankingDoc = await db.collection('season_rankings').findOne({ year: currentYear });
    if (!rankingDoc) {
      return NextResponse.json({ error: 'Ranking doc not found for current year' }, { status: 404 });
    }

    const top50 = rankingDoc.rankings
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 50);

    const qualifiedPlayerIds = top50.map((r: any) => new ObjectId(r.player_id));

    // 2. Clear everyone's qualification status and reset points for the new year
    // We update every profile in the user_profiles collection.
    await db.collection('user_profiles').updateMany(
      {},
      { 
        $set: { 
          "season.points": 0, 
          "season.rank": 0, 
          "season.year": nextYear,
          annual_championship_qualified: false
        } 
      }
    );

    // 3. Mark the top 50 as qualified
    if (qualifiedPlayerIds.length > 0) {
      await db.collection('user_profiles').updateMany(
        { _id: { $in: qualifiedPlayerIds } },
        { $set: { annual_championship_qualified: true } }
      );
    }

    // 4. Create a new blank ranking document for the next year
    const existingNext = await db.collection('season_rankings').findOne({ year: nextYear });
    if (!existingNext) {
      const newRanking = {
        year: nextYear,
        rankings: [],
        updated_at: new Date()
      };
      await db.collection('season_rankings').insertOne(newRanking);
    }

    return NextResponse.json({
      success: true,
      message: `Season reset complete for ${currentYear}. ${qualifiedPlayerIds.length} players qualified for the ${nextYear} Annual Championship.`,
      qualified_count: qualifiedPlayerIds.length,
      next_year: nextYear
    });

  } catch (error: any) {
    console.error('Qualification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
