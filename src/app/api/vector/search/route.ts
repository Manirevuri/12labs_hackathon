import { NextRequest, NextResponse } from 'next/server';
import { db, vectorMemories } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';
import { and, eq, desc, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      videoId, 
      indexId, 
      limit = 10, 
      threshold = 0.7,
      category,
      includeMetadata = true 
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`Searching vector database: "${query}" for video: ${videoId}, index: ${indexId}`);

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Build filter conditions
    const filters = [];
    if (videoId) filters.push(eq(vectorMemories.videoId, videoId));
    if (indexId) filters.push(eq(vectorMemories.indexId, indexId));
    if (category) {
      filters.push(sql`metadata->>'category' = ${category}`);
    }

    // Perform vector similarity search using cosine similarity
    const searchResults = await db
      .select({
        id: vectorMemories.id,
        videoId: vectorMemories.videoId,
        indexId: vectorMemories.indexId,
        sentence: vectorMemories.sentence,
        metadata: includeMetadata ? vectorMemories.metadata : sql`NULL`,
        confidence: vectorMemories.confidence,
        similarity: sql<number>`1 - (${vectorMemories.embedding} <=> ${`[${queryEmbedding.join(',')}]`})`.as('similarity'),
        createdAt: vectorMemories.createdAt
      })
      .from(vectorMemories)
      .where(
        filters.length > 0 
          ? and(
              ...filters,
              sql`1 - (${vectorMemories.embedding} <=> ${`[${queryEmbedding.join(',')}]`}) > ${threshold}`
            )
          : sql`1 - (${vectorMemories.embedding} <=> ${`[${queryEmbedding.join(',')}]`}) > ${threshold}`
      )
      .orderBy(desc(sql`1 - (${vectorMemories.embedding} <=> ${`[${queryEmbedding.join(',')}]`})`))
      .limit(limit);

    console.log(`Found ${searchResults.length} similar sentences`);
    
    // Log the first few results for debugging
    if (searchResults.length > 0) {
      console.log('Sample results:');
      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. Similarity: ${result.similarity?.toFixed(3)}, Sentence: "${result.sentence.substring(0, 100)}..."`);
        console.log(`   Category: ${(result.metadata as any)?.category}, Confidence: ${result.confidence}`);
      });
    }

    return NextResponse.json({
      success: true,
      query,
      results: searchResults,
      totalResults: searchResults.length,
      filters: {
        videoId: videoId || null,
        indexId: indexId || null,
        category: category || null,
        threshold
      }
    });

  } catch (error) {
    console.error('Error searching vector database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search vector database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}