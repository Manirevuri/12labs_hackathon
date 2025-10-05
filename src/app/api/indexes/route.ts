import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { twelveLabsClient } from '@/lib/twelvelabs';
import { getUserIndexes, addUserIndex } from '@/lib/redis';

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all indexes from TwelveLabs
    const allIndexes = await twelveLabsClient.indexes.list();
    
    // Get user's index IDs from Redis
    const userIndexIds = await getUserIndexes(userId);
    
    // Filter indexes to only include user's indexes
    const userIndexes = (allIndexes.data || []).filter(
      index => userIndexIds.includes(index.id)
    );
    
    // Get video counts for each user index
    const indexesWithCounts = await Promise.all(
      userIndexes.map(async (index) => {
        if (!index.id) {
          console.error('Index missing ID:', index);
          return {
            ...index,
            videoCount: 0
          };
        }

        try {
          const videos = await twelveLabsClient.indexes.videos.list(index.id);
          return {
            ...index,
            videoCount: videos.data?.length || 0
          };
        } catch (error) {
          console.error(`Error getting video count for index ${index.id}:`, error);
          return {
            ...index,
            videoCount: 0
          };
        }
      })
    );

    return NextResponse.json({ indexes: indexesWithCounts });
  } catch (error) {
    console.error('Error fetching indexes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch indexes' },
      { status: 500 }
    );
  }
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

    const { indexName, models } = await request.json();

    if (!indexName || !indexName.trim()) {
      return NextResponse.json(
        { error: 'Index name is required' },
        { status: 400 }
      );
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'At least one model configuration is required' },
        { status: 400 }
      );
    }

    // Validate model configurations
    for (const model of models) {
      if (!model.modelName || !model.modelOptions || !Array.isArray(model.modelOptions)) {
        return NextResponse.json(
          { error: 'Invalid model configuration' },
          { status: 400 }
        );
      }
      
      if (model.modelOptions.length === 0) {
        return NextResponse.json(
          { error: 'At least one modality must be selected for each model' },
          { status: 400 }
        );
      }

      // Validate model names
      if (!['marengo2.7', 'pegasus1.2'].includes(model.modelName)) {
        return NextResponse.json(
          { error: `Invalid model name: ${model.modelName}` },
          { status: 400 }
        );
      }

      // Validate modalities
      for (const option of model.modelOptions) {
        if (!['visual', 'audio'].includes(option)) {
          return NextResponse.json(
            { error: `Invalid modality: ${option}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if index with same name already exists
    const existingIndexes = await twelveLabsClient.indexes.list();
    const existingIndex = existingIndexes.data?.find(
      (index) => index.indexName === indexName
    );

    if (existingIndex) {
      return NextResponse.json(
        { error: 'An index with this name already exists' },
        { status: 409 }
      );
    }

    const index = await twelveLabsClient.indexes.create({
      indexName,
      models,
      videoOptions: {
        enableHls: true, // Enable HLS for thumbnails and video streaming
        thumbnailConfig: {
          enabled: true,
          count: 5, // Generate 5 thumbnails per video
        }
      }
    });

    // Associate index with user in Redis
    if (index.id) {
      await addUserIndex(userId, index.id);
      console.log(`Associated index ${index.id} with user ${userId}`);
    }

    return NextResponse.json({
      index: {
        ...index,
        videoCount: 0
      },
      message: 'Index created successfully',
    });
  } catch (error) {
    console.error('Error creating index:', error);
    return NextResponse.json(
      { error: 'Failed to create index' },
      { status: 500 }
    );
  }
}