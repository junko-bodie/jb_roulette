import { sql } from '@/lib/db/db';

export async function initDatabase() {
  try {
    console.log('Initializing database schema...');

    // Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        image TEXT,
        password TEXT,
        provider VARCHAR(50) DEFAULT 'credentials',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // User Game Data
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
        balance DECIMAL(15, 2) DEFAULT 1000.00,
        is_sound_enabled BOOLEAN DEFAULT TRUE,
        is_timer_enabled BOOLEAN DEFAULT TRUE,
        avatar_url TEXT,
        tier VARCHAR(50) DEFAULT 'High Roller',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Spin History
    await sql`
      CREATE TABLE IF NOT EXISTS spin_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        number INTEGER,
        color VARCHAR(10),
        bet_amount DECIMAL(15, 2),
        win_amount DECIMAL(15, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
