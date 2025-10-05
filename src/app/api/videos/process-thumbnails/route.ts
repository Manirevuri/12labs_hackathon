import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { twelveLabsClient } from '@/lib/twelvelabs';
import * as blob from '@vercel/blob';
import { getVideoUrl } from '@/lib/redis';

/**
 * Server-side thumbnail generation
 * This runs after video processing is complete
 */

// Helper function to extract frame from video URL using server-side processing
async function extractFrameFromVideoServer(
  videoUrl: string,
  timestamp: number
): Promise<Buffer | null> {
  try {
    // Option 1: Use a service like Cloudinary or Transloadit
    // Option 2: Use FFmpeg in a serverless function
    // Option 3: Use a dedicated video processing API
    
    // For now, we'll use a screenshot API service
    // You could use services like:
    // - screenshotapi.net
    // - htmlcsstoimage.com
    // - bannerbear.com
    
    // Temporary: Create a placeholder approach
    // In production, you'd integrate with a real service
    
    // Example using a hypothetical screenshot service:
    /*
    const screenshotUrl = `https://api.screenshot-service.com/capture?` +
      `url=${encodeURIComponent(videoUrl)}` +
      `&timestamp=${timestamp}` +
      `&format=jpg`;
    
    const response = await fetch(screenshotUrl);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
    */
    
    // For now, return null (you'll need to implement actual service)
    return null;
  } catch (error) {
    console.error('Error extracting frame:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (or use system auth for background jobs)
    const { userId } = await auth();
    
    const { taskId, videoId, indexId } = await request.json();

    if (!taskId || !videoId || !indexId) {
      return NextResponse.json(
        { error: 'Task ID, Video ID, and Index ID are required' },
        { status: 400 }
      );
    }

    console.log(`Starting thumbnail generation for video ${videoId}`);

    // Get video URL from Redis
    const videoUrl = await getVideoUrl(videoId);
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL not found' },
        { status: 404 }
      );
    }

    // Fetch all embeddings/segments for this video using search
    // We'll search for everything to get all segments
    const searchResults = await twelveLabsClient.search.query({
      indexId: indexId,
      queryText: '*', // Search for all content
      searchOptions: ['visual'],
      filter: {
        video_id: [videoId]
      },
      pageLimit: 50, // Get up to 50 segments
    });

    if (!searchResults.data || searchResults.data.length === 0) {
      console.log('No segments found for video');
      return NextResponse.json({
        message: 'No segments found for video',
        thumbnailsGenerated: 0
      });
    }

    console.log(`Found ${searchResults.data.length} segments for thumbnail generation`);

    const thumbnailsGenerated = [];
    const failedThumbnails = [];

    // Process each segment
    for (const segment of searchResults.data) {
      const timestamp = segment.start || 0;
      const segmentVideoId = segment.video_id || segment.videoId || videoId;
      
      try {
        // Check if thumbnail already exists
        const thumbnailKey = `thumbnail_${segmentVideoId}_${Math.floor(timestamp)}.jpg`;
        
        const existingBlobs = await blob.list({ prefix: thumbnailKey });
        if (existingBlobs.blobs.length > 0) {
          console.log(`Thumbnail already exists for ${segmentVideoId} at ${timestamp}`);
          thumbnailsGenerated.push({
            videoId: segmentVideoId,
            timestamp,
            url: existingBlobs.blobs[0].url,
            cached: true
          });
          continue;
        }

        // Generate thumbnail
        console.log(`Generating thumbnail for ${segmentVideoId} at ${timestamp}`);
        
        // For now, we'll create a simple placeholder
        // In production, you'd use a real frame extraction service
        const frameBuffer = await extractFrameFromVideoServer(videoUrl, timestamp);
        
        if (frameBuffer) {
          // Upload to Vercel Blob
          const thumbnailBlob = await blob.put(thumbnailKey, frameBuffer, {
            access: 'public',
            contentType: 'image/jpeg',
          });
          
          thumbnailsGenerated.push({
            videoId: segmentVideoId,
            timestamp,
            url: thumbnailBlob.url,
            cached: false
          });
        } else {
          // If we can't generate a real thumbnail, use a placeholder strategy
          // Store the video URL as the thumbnail URL for now
          failedThumbnails.push({
            videoId: segmentVideoId,
            timestamp,
            reason: 'Frame extraction not implemented'
          });
        }
      } catch (error) {
        console.error(`Failed to generate thumbnail for ${segmentVideoId} at ${timestamp}:`, error);
        failedThumbnails.push({
          videoId: segmentVideoId,
          timestamp,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Thumbnail generation complete: ${thumbnailsGenerated.length} generated, ${failedThumbnails.length} failed`);

    return NextResponse.json({
      message: 'Thumbnail generation complete',
      thumbnailsGenerated: thumbnailsGenerated.length,
      thumbnailsFailed: failedThumbnails.length,
      thumbnails: thumbnailsGenerated,
      failed: failedThumbnails
    });
  } catch (error: any) {
    console.error('Error in thumbnail generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnails', details: error?.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check thumbnail generation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // List all thumbnails for this video
    const thumbnailPrefix = `thumbnail_${videoId}_`;
    const thumbnails = await blob.list({ prefix: thumbnailPrefix });
    
    return NextResponse.json({
      videoId,
      thumbnailCount: thumbnails.blobs.length,
      thumbnails: thumbnails.blobs.map(b => ({
        url: b.url,
        uploadedAt: b.uploadedAt
      }))
    });
  } catch (error: any) {
    console.error('Error checking thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to check thumbnails' },
      { status: 500 }
    );
  }
}