import { NextRequest, NextResponse } from 'next/server';
import { storeVectorEmbeddings, type ExtractedSentence } from '@/lib/vector-processing';

export async function POST(request: NextRequest) {
  try {
    const { sentences, videoId, indexId } = await request.json() as {
      sentences: ExtractedSentence[];
      videoId: string;
      indexId: string;
    };

    if (!sentences || !videoId || !indexId) {
      return NextResponse.json(
        { error: 'Sentences, video ID, and index ID are required' },
        { status: 400 }
      );
    }

    const result = await storeVectorEmbeddings(sentences, videoId, indexId);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error storing vector embeddings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to store vector embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}