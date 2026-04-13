import { Pool } from 'pg';

/**
 * Handle Vercel's prefixed environment variables for Neon
 */
const connectionString = 
  process.env.vercel_db_POSTGRES_PRISMA_URL || 
  process.env.vercel_db_DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  if (!connectionString) {
    throw new Error("❌ DATABASE ERROR: No database connection string found. Checked for vercel_db_POSTGRES_PRISMA_URL, vercel_db_DATABASE_URL_UNPOOLED, POSTGRES_URL, and DATABASE_URL.");
  }
  const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  const result = await pool.query(query, values);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
  };
};

export default pool;
