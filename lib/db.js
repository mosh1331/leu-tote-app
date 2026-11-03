// lib/db.js
import { Pool } from '@neondatabase/serverless';

let pool;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

// Transaction wrapper for atomic order placement & point clawbacks
export async function withTransaction(callback) {
  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}