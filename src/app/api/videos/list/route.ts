import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indexId = searchParams.get('indexId');

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

    const videos = await twelveLabsClient.indexes.videos.list(indexId);

    const formattedVideos = videos.data?.map((video) => ({
      id: video.id,
      filename: video.metadata?.filename,
      duration: video.metadata?.duration,
      width: video.metadata?.width,
      height: video.metadata?.height,
      size: video.metadata?.size,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    }));

    return NextResponse.json({
      videos: formattedVideos || [],
      totalVideos: formattedVideos?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}