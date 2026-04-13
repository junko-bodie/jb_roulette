import { sql as vercelSql } from '@vercel/postgres';

/**
 * A wrapper around @vercel/postgres sql utility.
 * It automatically uses POSTGRES_URL from environment variables.
 */
export const sql = vercelSql;

// Explicitly export default for compatibility if needed
export default vercelSql;
