import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as blob from '@vercel/blob';
import { getVideoUrl } from '@/lib/redis';

// Function to extract frame from video at specific timestamp
async function extractFrameAtTimestamp(videoUrl: string, timestamp: number): Promise<Buffer> {
  // For now, we'll create a simple placeholder implementation
  // In production, you'd use a service like FFmpeg or a video processing API
  
  // Create a canvas-based placeholder (you can replace this with actual frame extraction)
  const canvas = await generatePlaceholderThumbnail(videoUrl, timestamp);
  return canvas;
}

// Generate a placeholder thumbnail (temporary solution)
async function generatePlaceholderThumbnail(videoUrl: string, timestamp: number): Promise<Buffer> {
  // This is a placeholder - in production, you'd extract the actual frame
  // For now, we'll return a simple image buffer
  
  // You could use node-canvas or sharp to generate an image
  // Or use a service like Cloudinary or FFmpeg
  
  // Temporary: return empty buffer (you'll need to implement actual frame extraction)
  return Buffer.from([]);
}

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

    const { videoId, timestamp } = await request.json();

    if (!videoId || timestamp === undefined) {
      return NextResponse.json(
        { error: 'Video ID and timestamp are required' },
        { status: 400 }
      );
    }

    // Generate thumbnail key
    const thumbnailKey = `thumbnail_${videoId}_${Math.floor(timestamp)}.jpg`;
    
    // Check if thumbnail already exists in Vercel Blob
    try {
      const existingBlobs = await blob.list({ prefix: thumbnailKey });
      if (existingBlobs.blobs.length > 0) {
        // Thumbnail already exists
        return NextResponse.json({
          thumbnailUrl: existingBlobs.blobs[0].url,
          cached: true
        });
      }
    } catch (error) {
      console.log('Thumbnail not found, generating new one');
    }

    // Get video URL from Redis
    const videoUrl = await getVideoUrl(videoId);
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Extract frame at timestamp
    const frameBuffer = await extractFrameAtTimestamp(videoUrl, timestamp);
    
    if (frameBuffer.length === 0) {
      // For now, return the video URL as thumbnail (browser will show first frame)
      // This is temporary until we implement proper frame extraction
      return NextResponse.json({
        thumbnailUrl: videoUrl,
        isVideoUrl: true,
        message: 'Using video URL as thumbnail (frame extraction not yet implemented)'
      });
    }

    // Upload thumbnail to Vercel Blob
    const thumbnailBlob = await blob.put(thumbnailKey, frameBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    return NextResponse.json({
      thumbnailUrl: thumbnailBlob.url,
      cached: false
    });
  } catch (error: any) {
    console.error('Error generating thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail', details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const timestamp = searchParams.get('timestamp');

    if (!videoId || !timestamp) {
      return NextResponse.json(
        { error: 'Video ID and timestamp are required' },
        { status: 400 }
      );
    }

    // Generate thumbnail key
    const thumbnailKey = `thumbnail_${videoId}_${Math.floor(Number(timestamp))}.jpg`;
    
    // Check if thumbnail exists in Vercel Blob
    try {
      const existingBlobs = await blob.list({ prefix: thumbnailKey });
      if (existingBlobs.blobs.length > 0) {
        return NextResponse.json({
          thumbnailUrl: existingBlobs.blobs[0].url,
          exists: true
        });
      }
    } catch (error) {
      console.log('Thumbnail not found');
    }

    // Get video URL as fallback
    const videoUrl = await getVideoUrl(videoId);
    
    return NextResponse.json({
      thumbnailUrl: videoUrl || null,
      exists: false,
      isVideoUrl: true
    });
  } catch (error: any) {
    console.error('Error getting thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to get thumbnail' },
      { status: 500 }
    );
  }
}