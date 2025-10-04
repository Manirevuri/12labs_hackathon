import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';

export async function POST(request: NextRequest) {
  try {
    const { 
      momentType, 
      customQuery, 
      videoIds = [], 
      confidence = 0.7,
      indexId
    } = await request.json();

    console.log('Extract request parameters:', {
      momentType,
      customQuery,
      videoIds,
      confidence,
      indexId
    });

    if (!momentType && !customQuery) {
      return NextResponse.json(
        { error: 'Either momentType or customQuery is required' },
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

    const predefinedQueries = {
      'emotional': 'emotional moments, tears, crying, reunion, happiness, joy',
      'action': 'action scenes, movement, running, fighting, sports',
      'dialogue': 'people talking, conversation, interview, speech',
      'brand': 'logo, brand mention, product placement, marketing',
      'music': 'music, singing, musical performance, dancing',
      'landscape': 'beautiful scenery, nature, outdoor shots, landscape',
    };

    const searchQuery = customQuery || predefinedQueries[momentType as keyof typeof predefinedQueries];

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Invalid moment type' },
        { status: 400 }
      );
    }

    const searchResults = await twelveLabsClient.search.query({
      indexId: indexId,
      queryText: searchQuery,
      searchOptions: ['visual', 'audio'],
      pageLimit: 50,
      threshold: confidence,
    });

    let filteredResults = searchResults.data || [];

    if (videoIds.length > 0) {
      filteredResults = filteredResults.filter(result => 
        videoIds.includes(result.metadata?.video_id)
      );
    }

    const extractedMoments = filteredResults.map((result) => ({
      id: result.id,
      videoId: result.metadata?.video_id,
      filename: result.metadata?.filename,
      start: result.start,
      end: result.end,
      duration: result.end - result.start,
      score: result.score,
      thumbnailUrl: result.thumbnailUrl,
    }));

    const groupedByVideo = extractedMoments.reduce((acc, moment) => {
      const videoId = moment.videoId;
      if (!acc[videoId]) {
        acc[videoId] = [];
      }
      acc[videoId].push(moment);
      return acc;
    }, {} as Record<string, typeof extractedMoments>);

    return NextResponse.json({
      momentType: momentType || 'custom',
      query: searchQuery,
      totalMoments: extractedMoments.length,
      videosProcessed: Object.keys(groupedByVideo).length,
      moments: extractedMoments,
      groupedByVideo,
    });
  } catch (error) {
    console.error('Error extracting moments:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to extract moments',
        details: error.message,
        statusCode: error.statusCode
      },
      { status: 500 }
    );
  }
}