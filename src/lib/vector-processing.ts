import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { db, vectorMemories } from '@/lib/db';
import { generateEmbeddings } from '@/lib/embeddings';

// Schema for extracted sentences
export const SentenceExtractionSchema = z.object({
  sentences: z.array(z.object({
    sentence: z.string(),
    category: z.enum(['topic', 'entity', 'action', 'dialogue', 'description', 'emotion', 'brand', 'setting']),
    importance: z.number().min(0).max(1),
    timestamp: z.string().optional(),
    emotion: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }))
});

export type ExtractedSentence = z.infer<typeof SentenceExtractionSchema>['sentences'][0];

export async function extractSentencesFromAnalysis(
  analysisText: string,
  videoId: string,
  indexId: string
) {
  console.log(`Extracting sentences from analysis for video ${videoId}`);

  try {
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

    return {
      sentences: result.object.sentences,
      videoId,
      indexId,
      totalSentences: result.object.sentences.length,
      success: true
    };
  } catch (error) {
    console.error('Error in extractSentencesFromAnalysis:', error);
    throw error;
  }
}

export async function storeVectorEmbeddings(
  sentences: ExtractedSentence[],
  videoId: string,
  indexId: string
) {
  console.log(`Storing ${sentences.length} sentences as vector embeddings for video ${videoId}`);

  // Generate embeddings for all sentences
  const sentenceTexts = sentences.map(s => s.sentence);
  const embeddings = await generateEmbeddings(sentenceTexts);
  
  console.log(`Generated ${embeddings.length} embeddings`);
  console.log(`First embedding type:`, typeof embeddings[0]);
  console.log(`First embedding length:`, embeddings[0]?.length);
  console.log(`First few values:`, embeddings[0]?.slice(0, 3));

  // Prepare data for database insertion
  const vectorData = sentences.map((sentence, index) => ({
    videoId,
    indexId,
    sentence: sentence.sentence,
    embedding: embeddings[index], // Raw number array for pgvector
    metadata: {
      category: sentence.category,
      importance: sentence.importance,
      timestamp: sentence.timestamp,
      emotion: sentence.emotion,
      ...sentence.metadata
    },
    confidence: sentence.importance, // Use importance as confidence
  }));

  // Insert into database using Drizzle
  const insertedRecords = await db.insert(vectorMemories).values(vectorData).returning({
    id: vectorMemories.id,
    sentence: vectorMemories.sentence,
    confidence: vectorMemories.confidence
  });

  console.log(`Successfully stored ${insertedRecords.length} vector memories`);

  return {
    success: true,
    stored: insertedRecords.length,
    videoId,
    indexId,
    records: insertedRecords
  };
}