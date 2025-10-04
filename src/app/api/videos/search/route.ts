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

    console.log('Raw search results:', JSON.stringify(searchResults, null, 2));
    console.log('Search results data length:', searchResults.data?.length);

    const formattedResults = searchResults.data?.map((result) => {
      console.log('Processing search result:', JSON.stringify(result, null, 2));
      return {
        id: result.id || result.videoId,
        score: result.score,
        start: result.start,
        end: result.end,
        metadata: {
          video_id: result.videoId,
          filename: result.filename || `Video ${result.videoId}`,
          duration: result.end - result.start,
          transcription: result.transcription,
          confidence: result.confidence
        },
        thumbnailUrl: result.thumbnailUrl,
      };
    });

    console.log('Formatted search results:', JSON.stringify(formattedResults, null, 2));

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