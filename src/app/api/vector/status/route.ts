import { NextRequest, NextResponse } from 'next/server';
import { db, vectorMemories } from '@/lib/db';
import { and, eq, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const indexId = searchParams.get('indexId');

    if (!videoId || !indexId) {
      return NextResponse.json(
        { error: 'Video ID and Index ID are required' },
        { status: 400 }
      );
    }

    // Check if vectors exist for this video/index combination
    const result = await db
      .select({ count: count() })
      .from(vectorMemories)
      .where(and(
        eq(vectorMemories.videoId, videoId),
        eq(vectorMemories.indexId, indexId)
      ));

    const vectorCount = result[0]?.count || 0;
    const hasVectors = vectorCount > 0;

    return NextResponse.json({
      success: true,
      videoId,
      indexId,
      hasVectors,
      vectorCount
    });

  } catch (error) {
    console.error('Error checking vector status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check vector status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}