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

    // Sort rankings by points descending (should already be sorted, but ensure here)
    const sortedRankings = [...rankingDoc.rankings].sort((a: any, b: any) => b.points - a.points);

    return NextResponse.json({
      year: rankingDoc.year,
      rankings: sortedRankings,
      updated_at: rankingDoc.updated_at
    });
  } catch (error: any) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
