-- Enable the vector extension for pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the vector_memories table with vector support
-- This will be managed by Drizzle, but keeping for reference