import { Pool, type QueryResultRow } from 'pg';

// Use DATABASE_URL for standard Postgres (Supabase, etc.)
// Fallback to Vercel Postgres env vars if needed
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase.co') || connectionString?.includes('pooler.supabase.com') 
    ? { rejectUnauthorized: false } 
    : false,
  // If using port 6543 (transaction mode), disable prepared statements
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * A tagged template literal that mimics the @vercel/postgres 'sql' tag
 * but uses a standard pg Pool.
 */
export async function sql<T extends QueryResultRow = any>(
  strings: TemplateStringsArray,
  ...values: any[]
) {
  const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  const result = await pool.query<T>(query, values);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
  };
}

export default pool;
