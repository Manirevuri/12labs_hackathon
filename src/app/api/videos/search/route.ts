import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';

export async function POST(request: NextRequest) {
  try {
    const { query, searchOptions = ['visual', 'audio'], indexId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    if (!indexId) {
      return NextResponse.json(
        { error: 'Index ID is required' },
        { status: 400 }
      );
    }

    // Verify the index exists
    try {
      await twelveLabsClient.indexes.retrieve(indexId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid index ID or index not found' },
        { status: 404 }
      );
    }

    const searchResults = await twelveLabsClient.search.query({
      indexId: indexId,
      queryText: query,
      searchOptions,
      pageLimit: 10,
    });

    // DO NOT stringify searchResults - it contains non-serializable objects
    console.log('Search completed, data length:', searchResults.data?.length);

    const formattedResults = searchResults.data?.map((result: any) => {
      // Use safe property access with defaults
      return {
        id: result.id || result.video_id || Math.random().toString(36).substring(7),
        score: result.score || 0,
        start: result.start || 0,
        end: result.end || 0,
        metadata: {
          video_id: result.video_id || result.videoId || 'unknown',
          filename: result.metadata?.filename || `Video ${result.video_id || result.videoId || 'unknown'}`,
          duration: (result.end || 0) - (result.start || 0),
          transcription: result.transcription,
          confidence: result.confidence
        },
        thumbnailUrl: result.thumbnail_url || result.thumbnailUrl,
      };
    });

    return NextResponse.json({
      results: formattedResults || [],
      query,
      totalResults: searchResults.data?.length || 0,
    });
  } catch (error) {
    console.error('Error searching videos:', error);
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    );
  }
}