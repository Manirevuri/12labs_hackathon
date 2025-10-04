import { NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';

export async function GET() {
  try {
    console.log('Testing TwelveLabs connection...');
    
    // Test basic connection by listing indexes
    const indexes = await twelveLabsClient.indexes.list();
    console.log('Connection successful, found indexes:', indexes.data?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: 'TwelveLabs connection successful',
      indexCount: indexes.data?.length || 0,
      indexes: indexes.data?.map(index => ({
        id: index.id,
        name: index.indexName
      }))
    });
  } catch (error) {
    console.error('TwelveLabs connection failed:', {
      error: error.message,
      statusCode: error.statusCode,
      body: error.body
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode
    }, { status: 500 });
  }
}