import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';
import * as blob from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request started');
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const fileName = formData.get('fileName') as string;
    const indexId = formData.get('indexId') as string;

    console.log('Form data extracted:', {
      fileName: fileName || file?.name,
      indexId,
      fileSize: file?.size,
      fileType: file?.type
    });

    if (!file) {
      console.log('Error: No video file provided');
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!indexId) {
      console.log('Error: Index ID is required');
      return NextResponse.json(
        { error: 'Index ID is required' },
        { status: 400 }
      );
    }

    // Verify the index exists
    console.log('Verifying index:', indexId);
    try {
      const index = await twelveLabsClient.indexes.retrieve(indexId);
      console.log('Index verified:', index.indexName);
    } catch (error) {
      console.log('Index verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid index ID or index not found' },
        { status: 404 }
      );
    }

    // Step 1: Upload to Vercel Blob
    console.log('Uploading to Vercel Blob...');
    let blobResult;
    try {
      // First try without random suffix
      blobResult = await blob.put(fileName || file.name, file, {
        access: 'public',
      });
      console.log('Blob upload successful:', blobResult.url);
    } catch (blobError) {
      console.error('Initial blob upload failed:', blobError.message);
      
      // If file already exists, add random suffix
      if (blobError.message?.includes('This blob already exists')) {
        console.log('File exists, uploading with unique filename...');
        try {
          blobResult = await blob.put(fileName || file.name, file, {
            access: 'public',
            addRandomSuffix: true,
          });
          console.log('Blob upload successful with unique name:', blobResult.url);
        } catch (retryError) {
          console.error('Retry blob upload failed:', retryError);
          throw new Error(`Failed to upload video to storage: ${retryError.message}`);
        }
      } else {
        throw new Error(`Failed to upload video to storage: ${blobError.message}`);
      }
    }
    
    // Step 2: Create TwelveLabs task with blob URL
    console.log('Creating TwelveLabs task with blob URL...');
    let task;
    try {
      task = await twelveLabsClient.tasks.create({
        indexId: indexId,
        videoUrl: blobResult.url,
        filename: fileName || file.name,
      });
      console.log('Task created successfully:', task.id);
    } catch (taskError) {
      console.error('TwelveLabs task creation failed:', taskError);
      throw new Error(`Failed to create TwelveLabs processing task: ${taskError.message}`);
    }

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      blobUrl: blobResult.url,
      message: 'Video uploaded to storage and TwelveLabs processing started',
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to upload video',
        details: error.message,
        statusCode: error.statusCode
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = await twelveLabsClient.tasks.retrieve(taskId);

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      progress: task.metadata?.progress,
      videoId: task.videoId,
    });
  } catch (error) {
    console.error('Error checking task status:', error);
    return NextResponse.json(
      { error: 'Failed to check task status' },
      { status: 500 }
    );
  }
}