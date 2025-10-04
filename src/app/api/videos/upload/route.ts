import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const fileName = formData.get('fileName') as string;
    const indexId = formData.get('indexId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const task = await twelveLabsClient.tasks.create({
      indexId: indexId,
      videoFile: buffer,
      filename: fileName || file.name,
    });

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      message: 'Video upload started successfully',
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
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