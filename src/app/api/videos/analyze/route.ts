import { NextRequest, NextResponse } from 'next/server';
import { twelveLabsClient } from '@/lib/twelvelabs';
import { getVideoAnalysis, storeVideoAnalysis } from '@/lib/redis';

// Helper function to extract key elements for graph visualization
function extractKeyElements(analysisText: string) {
  // Simple extraction logic - can be enhanced with more sophisticated parsing
  const topics: string[] = [];
  const entities: string[] = [];
  const scenes: string[] = [];
  const brands: string[] = [];
  
  // Extract topics (look for bullet points or numbered lists)
  const topicMatches = analysisText.match(/(?:•|-)?\s*(?:Primary Themes|Topics?|Concepts?).*?[:]\s*(.+)/gi);
  if (topicMatches) {
    topicMatches.forEach(match => {
      const extracted = match.replace(/(?:•|-)?\s*(?:Primary Themes|Topics?|Concepts?).*?[:]\s*/i, '').trim();
      if (extracted) topics.push(extracted);
    });
  }
  
  // Extract brand names
  const brandMatches = analysisText.match(/Brand\s+(?:Identification|Name).*?[:]\s*(.+)/gi);
  if (brandMatches) {
    brandMatches.forEach(match => {
      const extracted = match.replace(/Brand\s+(?:Identification|Name).*?[:]\s*/i, '').trim();
      if (extracted) brands.push(extracted);
    });
  }
  
  // Extract scene timestamps
  const sceneMatches = analysisText.match(/(?:\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(?:\d{1,2}:\d{2}(?::\d{2})?)/g);
  if (sceneMatches) {
    scenes.push(...sceneMatches);
  }
  
  // Extract key entities (people, objects, locations)
  const entityPatterns = [
    /(?:Key Objects?|Objects? Present).*?[:]\s*(.+)/gi,
    /(?:Key Persons?|Characters?).*?[:]\s*(.+)/gi,
    /(?:Locations?|Settings?).*?[:]\s*(.+)/gi
  ];
  
  entityPatterns.forEach(pattern => {
    const matches = analysisText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const extracted = match.replace(pattern, '$1').trim();
        if (extracted) entities.push(extracted);
      });
    }
  });
  
  return {
    topics: topics.slice(0, 10), // Limit for visualization
    entities: entities.slice(0, 15),
    scenes: scenes.slice(0, 8),
    brands: brands.slice(0, 5),
    summary: analysisText.substring(0, 500) + '...' // First 500 chars for summary
  };
}

export async function POST(request: NextRequest) {
  let videoId: string, indexId: string;
  
  try {
    const requestData = await request.json();
    videoId = requestData.videoId;
    indexId = requestData.indexId;

    if (!videoId || !indexId) {
      return NextResponse.json(
        { error: 'Video ID and Index ID are required' },
        { status: 400 }
      );
    }

    // Check if analysis already exists in Redis
    const cachedResult = await getVideoAnalysis(videoId);
    
    if (cachedResult) {
      console.log(`Returning cached analysis for video ${videoId}`);
      return NextResponse.json({
        analysis: cachedResult,
        cached: true
      });
    }

    console.log(`Generating new analysis for video ${videoId}`);

    // Generate analysis using Pegasus with detailed open-ended analysis
    // Add timeout wrapper to handle long-running requests
    const generateResponse = await Promise.race([
      twelveLabsClient.analyze({
        videoId: videoId,
        prompt: `**Objective**: Extract a comprehensive and detailed contextual understanding of the video content, focusing on elements critical for narrative, emotional, aesthetic, and production analysis, particularly for advertisement-specific insights.

**Output Format**: Provide a structured, timestamped output (e.g., JSON or detailed bullet points/paragraphs per scene/segment) containing the requested information.

## Detailed Contextual Information to Extract:

### 1. Overall Video Summary & Metadata:
- **Video Title/ID**: (If available)
- **High-level Description**: A concise summary of the video's main subject, purpose, and overall tone.
- **Inferred Video Category**: Is this an Advertisement, ShortFilm, Documentary, Tutorial, MusicVideo, etc.? (Crucial for conditional logic later).
- **Primary Themes/Concepts**: Keywords representing the overarching ideas or messages.

### 2. Scene-Level Analysis (Timestamped Segmentation):
For each distinct scene or significant segment, provide:
- **Scene ID/Number & Timestamps**: [Start Time] - [End Time]
- **Scene Description**: A detailed paragraph describing what is happening visually and audibly in this specific segment.
- **Key Objects Present**: List major objects, their descriptions (e.g., "red sports car," "vintage camera"), and their relative prominence/size within the frame.
- **Key Persons/Characters**: Identify individuals, their actions, expressed emotions, and relationships (if discernible). Include inferred roles (e.g., "protagonist," "customer," "narrator").
- **Locations/Settings**: Detailed description of the environment (e.g., "bustling city street at dusk," "cozy modern kitchen," "serene forest clearing"). Include atmosphere.
- **Actions/Events**: What specific actions are taking place? Are there significant events or interactions?
- **Dialogue/Narration**: Full transcription of spoken words, identifying speakers where possible, along with inferred tone/emotion.
- **On-screen Text/Graphics**: Any text displayed visually, including logos, slogans, product names, or call-to-actions.
- **Audio Events**: Describe non-dialogue audio (e.g., "upbeat pop music," "sound of waves," "car engine revving," "laughter," "dramatic tension music").
- **Inferred Emotion(s) & Intensity**: The dominant emotional tone(s) evoked in this scene (e.g., "joyful - high," "suspenseful - medium," "calm - low").
- **Visual Aesthetics**:
  - *Dominant Colors/Color Palette*: (e.g., "warm tones," "cool blues," "monochromatic").
  - *Lighting*: (e.g., "soft natural light," "harsh fluorescent," "dramatic low key").
  - *Camera Work/Cinematography*: (e.g., "slow pan," "close-up shot," "wide establishing shot," "handheld dynamic," "smooth tracking").
  - *Overall Visual Style*: Keywords describing the aesthetic (e.g., "cinematic," "minimalist," "gritty," "bright & airy," "vintage").
  - *Pacing*: Is the scene fast, slow, or moderate?

### 3. Advertisement-Specific Elements (If Inferred Video Category is "Advertisement"):
- **Brand Identification**: Clearly state the Brand name(s) identified.
- **Product/Service Identification**: Clearly state the Product or Service being advertised.
- **Slogans/Taglines**: Any distinct slogans associated with the brand or product.
- **Call-to-Action (CTA)**: Identify any explicit or implicit calls for viewers to do something (e.g., "Visit our website," "Buy now," "Learn more").
- **Brand/Product Prominence**: For each scene, assess the prominence and centrality of the brand/product. (e.g., "Brand logo visible in background," "Product is the focus of interaction," "Product being directly demonstrated").
- **Target Audience (Inferred)**: Based on the content, who is this advertisement likely aimed at?

### 4. Narrative & Emotional Flow (Across Scenes):
- **Overall Emotional Arc**: Describe the progression of emotions throughout the entire video. Does it start calm and build to excitement? Is it humorous, then serious?
- **Narrative Structure Summary**: Identify key narrative beats if discernible (e.g., problem introduction, solution, climax, resolution).
- **Key Takeaways/Message**: What is the primary message or takeaway the video aims to convey?

### 5. Production Elements (If Discernible):
- **Music Description**: Genre, mood, tempo, and how it contributes to the scene/overall video.
- **Sound Design**: Specific sound effects used for emphasis or atmosphere.
- **Voice-over**: If present, who is speaking and what is the tone?`,
        temperature: 0.2,
        maxTokens: 4000
      }),
      // Add 2-minute timeout
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout after 2 minutes')), 120000)
      )
    ]);

    // Extract the analysis text from the response
    let analysisText = typeof generateResponse === 'string' ? generateResponse : (generateResponse as any).data || '';
    
    // If analysis is empty or failed, provide a basic fallback
    if (!analysisText || analysisText.trim().length === 0) {
      throw new Error('Empty analysis response from Pegasus');
    }
    
    console.log('Post-processing analysis with GPT-4o-mini for graph extraction...');
    
    // Use GPT-4o-mini to extract structured graph data
    let graphData = null;
    try {
      const graphResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/videos/extract-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisText })
      });
      
      if (graphResponse.ok) {
        const graphResult = await graphResponse.json();
        graphData = graphResult.graphData;
        console.log('Graph data extraction successful');
      } else {
        console.error('Graph extraction failed, falling back to basic extraction');
        graphData = extractKeyElements(analysisText);
      }
    } catch (error) {
      console.error('Error during graph extraction, falling back:', error);
      graphData = extractKeyElements(analysisText);
    }
    
    // Create structured analysis object
    const analysis = {
      analysisText: analysisText,
      timestamp: new Date().toISOString(),
      videoId: videoId,
      modelUsed: "pegasus1.2",
      promptType: "comprehensive_video_analysis",
      // Use GPT-4o-mini extracted data or fallback to basic extraction
      extractedElements: graphData || extractKeyElements(analysisText),
      enhancedWithGPT: !!graphData
    };

    // Store in Redis with 7-day expiration
    await storeVideoAnalysis(videoId, analysis);
    
    console.log(`Analysis completed and cached for video ${videoId}`);

    return NextResponse.json({
      analysis,
      cached: false
    });

  } catch (error) {
    console.error('Error analyzing video:', error);
    
    // If it's a timeout or the detailed analysis failed, try with a simpler prompt
    if (videoId && error instanceof Error && (error.message.includes('timeout') || error.message.includes('Analysis timeout'))) {
      console.log('Detailed analysis timed out, trying with simplified prompt...');
      
      try {
        const simpleResponse = await Promise.race([
          twelveLabsClient.analyze({
            videoId,
            prompt: `Provide a concise analysis of this video including:
            
1. **Video Summary**: Brief description of the main content and purpose
2. **Key Elements**: Main objects, people, and settings visible
3. **Topics**: Primary themes or subjects covered
4. **Brand/Product**: Any brands or products featured (if applicable)
5. **Emotional Tone**: Overall mood and sentiment
6. **Key Scenes**: Major moments with timestamps if possible

Format as structured text with clear headings.`,
            temperature: 0.3,
            maxTokens: 2000
          }),
          // Shorter timeout for fallback
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fallback analysis timeout')), 60000)
          )
        ]);
        
        const fallbackAnalysisText = typeof simpleResponse === 'string' ? simpleResponse : (simpleResponse as any).data || '';
        
        if (fallbackAnalysisText && fallbackAnalysisText.trim().length > 0) {
          const fallbackAnalysis = {
            analysisText: fallbackAnalysisText,
            timestamp: new Date().toISOString(),
            videoId: videoId,
            modelUsed: "pegasus1.2-fallback",
            promptType: "simplified_analysis",
            extractedElements: extractKeyElements(fallbackAnalysisText),
            enhancedWithGPT: false
          };
          
          // Store fallback analysis
          await storeVideoAnalysis(videoId, fallbackAnalysis);
          
          console.log(`Fallback analysis completed for video ${videoId}`);
          
          return NextResponse.json({
            analysis: fallbackAnalysis,
            cached: false,
            fallback: true
          });
        }
      } catch (fallbackError) {
        console.error('Fallback analysis also failed:', fallbackError);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze video. Please try again or contact support.' },
      { status: 500 }
    );
  }
}