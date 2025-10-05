import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
      webSearch,
      indexId,
    }: { 
      messages: UIMessage[]; 
      model: string; 
      webSearch: boolean;
      indexId?: string;
    } = await req.json();

    // Map model names to actual model identifiers
    const modelMap: Record<string, string> = {
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4o': 'gpt-4o',
    };

    const selectedModel = modelMap[model] || 'gpt-4o-mini';

    // Build system prompt based on context
    let systemPrompt = 'You are a helpful AI assistant specialized in video analysis and content understanding. Help users understand video content, themes, insights, and provide detailed analysis.';
    
    if (indexId) {
      systemPrompt = `You are a specialized video analysis assistant working with TwelveLabs Index: ${indexId}. 

You help users analyze and understand video content from their video library. You can:
- Analyze video content, themes, and narratives
- Identify key moments, emotions, and actions
- Extract insights about brands, products, and entities
- Provide detailed scene-by-scene breakdowns
- Answer questions about video metadata and context

Always provide comprehensive, detailed responses about video content analysis.`;
    }

    if (webSearch) {
      systemPrompt = 'You are a helpful assistant that can answer questions and help with tasks. You have access to web search capabilities to provide current information.';
    }

    const result = streamText({
      model: webSearch ? openai('gpt-4o') : openai(selectedModel),
      messages: convertToModelMessages(messages),
      system: systemPrompt,
    });

    // send sources and reasoning back to the client
    return result.toUIMessageStreamResponse({
      sendSources: webSearch,
      sendReasoning: false,
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}