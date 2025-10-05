import { Pool } from '@neondatabase/serverless';

export async function initDatabase() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL!,
  });

  try {
    // Enable vector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Vector extension enabled successfully');
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  } finally {
    await pool.end();
  }
}