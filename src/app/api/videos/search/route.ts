import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { twelveLabsClient } from '@/lib/twelvelabs';
import { getVideoUrl, isUserIndexOwner } from '@/lib/redis';
import { generateThumbnailUrl } from '@/lib/thumbnail-generator';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Check if user owns this index
    const isOwner = await isUserIndexOwner(userId, indexId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have access to this index' },
        { status: 403 }
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

    const formattedResults = await Promise.all(searchResults.data?.map(async (result: any) => {
      const videoId = result.video_id || result.videoId || 'unknown';
      const startTime = result.start || 0;
      
      // Try to get video URL from Redis
      let videoUrl = null;
      try {
        videoUrl = await getVideoUrl(videoId);
        if (videoUrl) {
          console.log(`Found video URL in Redis for video ID: ${videoId}`);
        }
      } catch (error) {
        console.error(`Failed to get video URL from Redis for video ID: ${videoId}`, error);
      }
      
      // Generate thumbnail URL based on videoId and timestamp
      // This will create a consistent URL pattern for thumbnails
      const thumbnailUrl = generateThumbnailUrl(videoId, startTime);
      
      // Use safe property access with defaults
      return {
        id: result.id || videoId || Math.random().toString(36).substring(7),
        score: result.score || 0,
        start: startTime,
        end: result.end || 0,
        metadata: {
          video_id: videoId,
          filename: result.metadata?.filename || `Video ${videoId}`,
          duration: (result.end || 0) - startTime,
          transcription: result.transcription,
          confidence: result.confidence,
          // Use video URL from Redis if available, otherwise fallback to result
          video_url: videoUrl || result.video_url || result.metadata?.video_url || null
        },
        // Use generated thumbnail URL instead of the one from TwelveLabs
        thumbnailUrl: thumbnailUrl,
      };
    }) || []);

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