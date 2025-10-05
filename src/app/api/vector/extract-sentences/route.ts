import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for extracted sentences
const SentenceExtractionSchema = z.object({
  sentences: z.array(z.object({
    sentence: z.string(),
    category: z.enum(['topic', 'entity', 'action', 'dialogue', 'description', 'emotion', 'brand', 'setting']),
    importance: z.number().min(0).max(1),
    timestamp: z.string().optional(),
    emotion: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }))
});

export async function POST(request: NextRequest) {
  try {
    const { analysisText, videoId, indexId } = await request.json();

    if (!analysisText || !videoId || !indexId) {
      return NextResponse.json(
        { error: 'Analysis text, video ID, and index ID are required' },
        { status: 400 }
      );
    }

    console.log(`Extracting sentences from analysis for video ${videoId}`);

    // Use GPT-4o-mini to convert analysis into meaningful sentences
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: SentenceExtractionSchema,
      prompt: `You are an expert at extracting meaningful, searchable sentences from video analysis content.

Your task is to convert the following video analysis into a collection of meaningful, complete sentences that can be used for vector search and retrieval.

Guidelines:
1. **Extract Complete Thoughts**: Each sentence should be a complete, standalone thought that makes sense without context
2. **Preserve Important Details**: Keep timestamps, names, objects, actions, emotions, and descriptions intact
3. **Categorize Content**: Assign appropriate categories (topic, entity, action, dialogue, description, emotion, brand, setting)
4. **Maintain Context**: Ensure sentences retain enough context to be useful for search
5. **Filter Quality**: Only include sentences that add meaningful information
6. **Importance Scoring**: Score based on how central the information is to understanding the video (1.0 = most important, 0.1 = least important)

Examples of good sentence extraction:
- Original: "The video shows a red sports car driving through a city at sunset"
- Extracted: "A red sports car drives through a city at sunset" (category: description, importance: 0.8)

- Original: "At 0:45, John appears excited about the new product launch"
- Extracted: "John appears excited about the new product launch at 0:45" (category: emotion, importance: 0.9, timestamp: "0:45")

Video Analysis to Process:
${analysisText}

Extract meaningful sentences that capture all important information from this video analysis:`,
      temperature: 0.2,
    });

    console.log(`Successfully extracted ${result.object.sentences.length} sentences`);

    return NextResponse.json({
      sentences: result.object.sentences,
      videoId,
      indexId,
      totalSentences: result.object.sentences.length,
      success: true
    });

  } catch (error) {
    console.error('Error extracting sentences:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.json(
      { 
        error: 'Failed to extract sentences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}