import { getDb } from '@/lib/db/mongodb';

export async function initDatabase() {
  try {
    console.log('Initializing MongoDB indexes...');
    const db = await getDb();

    // Ensure unique index on supabase_id for user profiles
    await db.collection('user_profiles').createIndex(
      { supabase_id: 1 },
      { unique: true }
    );

    // Index on email for lookups
    await db.collection('user_profiles').createIndex(
      { email: 1 }
    );

    // Spin history index on user for quick lookups
    await db.collection('spin_history').createIndex(
      { supabase_id: 1, created_at: -1 }
    );

    console.log('MongoDB indexes created successfully.');
  } catch (error) {
    console.error('Error initializing MongoDB:', error);
  }
}
