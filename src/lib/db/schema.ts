import { pgTable, text, timestamp, uuid, jsonb, vector, real, index } from 'drizzle-orm/pg-core';

export const vectorMemories = pgTable(
  'vector_memories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    videoId: text('video_id').notNull(),
    indexId: text('index_id').notNull(),
    sentence: text('sentence').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(), // OpenAI ada-002 dimensions
    metadata: jsonb('metadata').$type<{
      timestamp?: string;
      scene?: string;
      importance?: number;
      emotion?: string;
      category?: 'topic' | 'entity' | 'action' | 'dialogue' | 'description' | 'emotion' | 'brand' | 'setting';
      [key: string]: any;
    }>(),
    confidence: real('confidence').default(1.0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    videoIdIdx: index('video_id_idx').on(table.videoId),
    indexIdIdx: index('index_id_idx').on(table.indexId),
    videoIndexIdx: index('video_index_idx').on(table.videoId, table.indexId),
    embeddingIdx: index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  })
);

export type VectorMemory = typeof vectorMemories.$inferSelect;
export type NewVectorMemory = typeof vectorMemories.$inferInsert;