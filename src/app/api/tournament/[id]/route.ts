import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    const tournament = await db.collection('tournaments').findOne({ 
      _id: new ObjectId(id) 
    });

    const activeRound = await db.collection('rounds').findOne({ 
      tournament_id: new ObjectId(id),
      status: "active"
    }, { sort: { created_at: -1 } });
    
    return NextResponse.json({
      ...tournament,
      active_round: activeRound
    });
  } catch (error: any) {
    console.error('Fetch tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
