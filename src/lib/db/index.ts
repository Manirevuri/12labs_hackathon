import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  maxAllocatedConnections: 10,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

export * from './schema';