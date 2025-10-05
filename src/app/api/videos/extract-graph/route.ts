import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for the structured graph data we want to extract
const GraphDataSchema = z.object({
  topics: z.array(z.string()).describe('Main topics and themes from the video'),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['person', 'place', 'object', 'concept', 'brand']),
    confidence: z.number().min(0).max(1),
    description: z.string().optional()
  })).describe('Key entities found in the video'),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['mentions', 'relates_to', 'occurs_with', 'uses', 'shows']),
    strength: z.number().min(0).max(1)
  })).describe('Relationships between entities'),
  keyMoments: z.array(z.object({
    timestamp: z.string(),
    description: z.string(),
    importance: z.number().min(0).max(1)
  })).describe('Important moments with timestamps'),
  brands: z.array(z.object({
    name: z.string(),
    prominence: z.number().min(0).max(1),
    context: z.string()
  })).describe('Brands or products identified'),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  summary: z.string().describe('Concise summary of the video content')
});

export async function POST(request: NextRequest) {
  try {
    const { analysisText } = await request.json();

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Analysis text is required' },
        { status: 400 }
      );
    }

    console.log('Extracting graph data from analysis using GPT-4o-mini...');

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: GraphDataSchema,
      prompt: `You are an expert at analyzing video content and extracting structured data for graph visualization.

Given the following comprehensive video analysis, extract structured data that can be used to create an interactive graph visualization.

Focus on:
1. **Entities**: People, places, objects, concepts, brands (with confidence scores)
2. **Relationships**: How entities relate to each other (with strength scores)
3. **Topics**: Main themes and subjects
4. **Key Moments**: Important timestamps and what happens
5. **Brands**: Any commercial entities or products mentioned
6. **Overall sentiment and summary**

For relationships, be specific about how entities connect:
- "mentions" - when one entity is mentioned in context of another
- "relates_to" - conceptual relationship
- "occurs_with" - appears in same scene/context
- "uses" - when someone uses an object/service
- "shows" - when something is visually displayed

Provide confidence/strength scores between 0-1 based on how prominently featured or certain the relationship is.

Here is the video analysis to process:

${analysisText}

Extract the structured data for graph visualization:`,
      temperature: 0.1,
    });

    console.log('Graph data extraction completed');

    return NextResponse.json({
      graphData: result.object,
      success: true
    });

  } catch (error) {
    console.error('Error extracting graph data:', error);
    return NextResponse.json(
      { error: 'Failed to extract graph data' },
      { status: 500 }
    );
  }
}