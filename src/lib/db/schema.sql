-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  image TEXT,
  password TEXT, -- For email/password if needed, hashes only
  provider VARCHAR(50) DEFAULT 'credentials', -- 'google' or 'credentials' or 'guest'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Game Data (Balance, Settings)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  balance DECIMAL(15, 2) DEFAULT 1000.00,
  is_sound_enabled BOOLEAN DEFAULT TRUE,
  is_timer_enabled BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  tier VARCHAR(50) DEFAULT 'High Roller',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game History (Optional persistent history)
CREATE TABLE IF NOT EXISTS spin_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  number INTEGER,
  color VARCHAR(10),
  bet_amount DECIMAL(15, 2),
  win_amount DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
