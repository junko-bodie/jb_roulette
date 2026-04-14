import { getUser, ensureUserProfile } from '@/lib/auth';
import { getDb } from '@/lib/db/mongodb';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure profile exists first
    await ensureUserProfile(user);

    const { amount, action } = await req.json();
    const db = await getDb();
    const profiles = db.collection('user_profiles');

    if (action === 'increment') {
      await profiles.updateOne(
        { supabase_id: user.id },
        { $inc: { balance: amount }, $set: { updated_at: new Date() } }
      );
    } else if (action === 'decrement') {
      await profiles.updateOne(
        { supabase_id: user.id },
        { $inc: { balance: -amount }, $set: { updated_at: new Date() } }
      );
    } else if (action === 'set') {
      await profiles.updateOne(
        { supabase_id: user.id },
        { $set: { balance: amount, updated_at: new Date() } }
      );
    }

    const result = await profiles.findOne({ supabase_id: user.id });
    return NextResponse.json({ success: true, balance: result?.balance ?? 1000 });
  } catch (error: any) {
    console.error('Balance update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update balance', 
      message: error.message 
    }, { status: 500 });
  }
}
