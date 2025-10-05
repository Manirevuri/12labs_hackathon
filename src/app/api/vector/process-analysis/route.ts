import { NextRequest, NextResponse } from 'next/server';
import { getVideoAnalysis } from '@/lib/redis';
import { extractSentencesFromAnalysis, storeVectorEmbeddings } from '@/lib/vector-processing';

export async function POST(request: NextRequest) {
  try {
    const { videoId, indexId } = await request.json();

    if (!videoId || !indexId) {
      return NextResponse.json(
        { error: 'Video ID and Index ID are required' },
        { status: 400 }
      );
    }

    console.log(`Processing analysis for vector storage: video ${videoId}, index ${indexId}`);

    // Get the existing analysis from Redis
    const analysis = await getVideoAnalysis(videoId);
    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis found for this video. Please analyze the video first.' },
        { status: 404 }
      );
    }

    // Extract sentences using GPT-4o-mini (direct function call would be better, but testing HTTP for now)
    const sentenceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/vector/extract-sentences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisText: analysis.analysisText,
        videoId,
        indexId
      })
    });

    if (!sentenceResponse.ok) {
      const errorText = await sentenceResponse.text();
      throw new Error(`Failed to extract sentences: ${errorText}`);
    }

    const sentenceData = await sentenceResponse.json();

    // Store sentences as vector embeddings
    const storeData = await storeVectorEmbeddings(
      sentenceData.sentences,
      videoId,
      indexId
    );

    console.log(`Successfully processed analysis: ${storeData.stored} sentences stored as vectors`);

    return NextResponse.json({
      success: true,
      videoId,
      indexId,
      sentencesExtracted: sentenceData.totalSentences,
      vectorsStored: storeData.stored,
      analysisTimestamp: analysis.timestamp,
      modelUsed: analysis.modelUsed
    });

  } catch (error) {
    console.error('Error processing analysis for vector storage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process analysis for vector storage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}