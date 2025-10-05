import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as blob from '@vercel/blob';

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

    const formData = await request.formData();
    const thumbnail = formData.get('thumbnail') as File;
    const videoId = formData.get('videoId') as string;
    const timestamp = formData.get('timestamp') as string;

    if (!thumbnail || !videoId || !timestamp) {
      return NextResponse.json(
        { error: 'Thumbnail, video ID, and timestamp are required' },
        { status: 400 }
      );
    }

    // Generate a consistent filename
    const filename = `thumbnail_${videoId}_${Math.floor(Number(timestamp))}.jpg`;
    
    try {
      // Check if thumbnail already exists
      const existingBlobs = await blob.list({ prefix: filename });
      if (existingBlobs.blobs.length > 0) {
        // Return existing thumbnail
        return NextResponse.json({
          thumbnailUrl: existingBlobs.blobs[0].url,
          cached: true
        });
      }
    } catch (error) {
      console.log('Checking for existing thumbnail failed, uploading new one');
    }

    // Upload thumbnail to Vercel Blob
    const thumbnailBlob = await blob.put(filename, thumbnail, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    console.log(`Uploaded thumbnail for video ${videoId} at timestamp ${timestamp}`);

    return NextResponse.json({
      thumbnailUrl: thumbnailBlob.url,
      cached: false
    });
  } catch (error: any) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to upload thumbnail', details: error?.message },
      { status: 500 }
    );
  }
}