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

    console.log('Raw videos response:', JSON.stringify(videos, null, 2));
    console.log('Videos data length:', videos.data?.length);

    const formattedVideos = videos.data?.map((video) => {
      console.log('Processing video:', JSON.stringify(video, null, 2));
      return {
        id: video.id,
        filename: video.systemMetadata?.filename,
        duration: video.systemMetadata?.duration,
        width: video.systemMetadata?.width,
        height: video.systemMetadata?.height,
        size: video.systemMetadata?.size,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        thumbnailUrl: video.hls?.thumbnail_urls?.[0], // Get first thumbnail
        videoUrl: video.hls?.video_url,
        hlsStatus: video.hls?.status,
      };
    });

    console.log('Formatted videos:', JSON.stringify(formattedVideos, null, 2));

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