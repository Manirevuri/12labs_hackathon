import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL!,
  });

  try {
    // Create the vector_memories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vector_memories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id text NOT NULL,
        index_id text NOT NULL,
        sentence text NOT NULL,
        embedding vector(1536) NOT NULL,
        metadata jsonb,
        confidence real DEFAULT 1.0,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS video_id_idx ON vector_memories (video_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS index_id_idx ON vector_memories (index_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS video_index_idx ON vector_memories (video_id, index_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS embedding_idx ON vector_memories USING hnsw (embedding vector_cosine_ops);');

    console.log('Vector database tables created successfully');
    
    return NextResponse.json({ 
      message: 'Vector database tables created successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error creating tables:', error);
    return NextResponse.json({ 
      error: 'Failed to create tables',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}