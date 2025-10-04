import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const indexId = params.id;
    if (!indexId) {
      return NextResponse.json(
        { error: 'Index ID is required' },
        { status: 400 }
      );
    }

    const index = await twelveLabsClient.indexes.retrieve(indexId);
    
    // Get video count for this index
    try {
      const videos = await twelveLabsClient.indexes.videos.list(indexId);
      return NextResponse.json({
        index: {
          ...index,
          videoCount: videos.data?.length || 0
        }
      });
    } catch (error) {
      console.error(`Error getting video count for index ${indexId}:`, error);
      return NextResponse.json({
        index: {
          ...index,
          videoCount: 0
        }
      });
    }
  } catch (error) {
    console.error('Error retrieving index:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve index' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const indexId = params.id;
    if (!indexId) {
      return NextResponse.json(
        { error: 'Index ID is required' },
        { status: 400 }
      );
    }

    await twelveLabsClient.indexes.delete(indexId);
    
    return NextResponse.json({
      message: 'Index deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting index:', error);
    return NextResponse.json(
      { error: 'Failed to delete index' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { indexName } = await request.json();

    if (!indexName || !indexName.trim()) {
      return NextResponse.json(
        { error: 'Index name is required' },
        { status: 400 }
      );
    }

    // Note: TwelveLabs API might not support updating index names directly
    // This would depend on the actual API capabilities
    // For now, we'll return an error indicating this isn't supported
    
    return NextResponse.json(
      { error: 'Index name cannot be changed after creation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating index:', error);
    return NextResponse.json(
      { error: 'Failed to update index' },
      { status: 500 }
    );
  }
}