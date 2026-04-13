import { Pool, type QueryResultRow } from 'pg';

// Prioritize Vercel Postgres/Neon storage
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString 
    ? { rejectUnauthorized: false } // Cloud providers like Vercel/Neon require SSL
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased timeout for serverless wake-ups
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
