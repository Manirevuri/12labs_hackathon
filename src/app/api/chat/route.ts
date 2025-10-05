import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getVideoAnalysis } from '@/lib/redis';
import { twelveLabsClient } from '@/lib/twelvelabs';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, videoId, indexId }: { messages: UIMessage[]; videoId?: string; indexId?: string } = await req.json();

    // Build context based on available information
    let systemPrompt = 'You are a helpful AI assistant specialized in video analysis and content understanding. Help users understand video content, themes, and insights.';
    let contextAnalyses: string[] = [];
    
    // If videoId is provided, get specific video analysis
    if (videoId) {
      const analysis = await getVideoAnalysis(videoId);
      if (analysis) {
        contextAnalyses.push(`Video ${videoId} Analysis:\n${analysis.analysisText}`);
      }
    }
    
    // If indexId is provided, get analyses for all videos in that index
    if (indexId) {
      try {
        const videos = await twelveLabsClient.indexes.videos.list(indexId);
        
        if (videos.data && videos.data.length > 0) {
          const videoSummaries: string[] = [];
          
          // Fetch analysis for each video in the index
          for (const video of videos.data.slice(0, 10)) { // Limit to first 10 videos to avoid token limits
            if (video.id) {
              const analysis = await getVideoAnalysis(video.id);
              if (analysis) {
                const videoName = video.systemMetadata?.filename || `Video ${video.id}`;
                videoSummaries.push(`${videoName}: ${analysis.analysisText.substring(0, 500)}...`);
              }
            }
          }
          
          if (videoSummaries.length > 0) {
            contextAnalyses.push(`Index ${indexId} contains ${videos.data.length} videos. Here are analysis summaries for available videos:\n\n${videoSummaries.join('\n\n')}`);
          } else {
            contextAnalyses.push(`Index ${indexId} contains ${videos.data.length} videos, but no analysis data is available yet. Suggest users to analyze their videos first.`);
          }
        }
      } catch (error) {
        console.error('Error fetching videos from index:', error);
      }
    }
    
    // Build final system prompt with context
    if (contextAnalyses.length > 0) {
      systemPrompt = `You are an AI assistant helping users understand their video content. You have access to the following video analysis data:

${contextAnalyses.join('\n\n---\n\n')}

Use this information to answer questions about the videos, their content, themes, emotions, actions, and provide insights. Be helpful and reference specific details from the analyses when relevant. If asked about videos that don't have analysis data, suggest that they analyze those videos first.`;
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: convertToModelMessages(messages),
      system: systemPrompt,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}