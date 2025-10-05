import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getVideoAnalysis } from '@/lib/redis';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, videoId }: { messages: UIMessage[]; videoId: string } = await req.json();

    // Get video analysis for context if videoId is provided
    let systemPrompt = 'You are a helpful AI assistant specialized in video analysis and content understanding. Help users understand video content, themes, and insights.';
    
    if (videoId) {
      const analysis = await getVideoAnalysis(videoId);
      if (analysis) {
        systemPrompt = `Context: You are an AI assistant helping users understand a video analysis. Here is the comprehensive analysis of the video:

${analysis.analysisText}

Use this analysis to answer questions about the video content, themes, emotions, actions, and any other aspects covered in the analysis. Be helpful and provide specific details from the analysis when relevant.`;
      }
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