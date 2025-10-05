import type { VectorMemory } from '@/lib/db';

/**
 * Calculate cosine similarity between two embedding vectors
 */
export const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    const a = vectorA[i]!;
    const b = vectorB[i]!;
    
    if (typeof a !== "number" || typeof b !== "number" || isNaN(a) || isNaN(b)) {
      throw new Error("Vectors must contain only numbers");
    }
    
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
};

/**
 * Calculate semantic similarity between two vector memories
 */
export const calculateSentenceSimilarity = (
  memoryA: VectorMemory,
  memoryB: VectorMemory
): number => {
  // Parse embedding strings back to arrays
  const embeddingA = parseEmbeddingString(memoryA.embedding);
  const embeddingB = parseEmbeddingString(memoryB.embedding);
  
  if (!embeddingA || !embeddingB) {
    return 0;
  }

  try {
    const similarity = cosineSimilarity(embeddingA, embeddingB);
    // Convert from [-1, 1] to [0, 1] range
    return Math.max(0, similarity);
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
};

/**
 * Parse embedding data from database back to number array
 */
export const parseEmbeddingString = (embeddingData: string | number[] | null | undefined): number[] | null => {
  try {
    // Handle null/undefined
    if (!embeddingData) {
      return null;
    }
    
    // If already a number array, return as-is
    if (Array.isArray(embeddingData)) {
      return embeddingData;
    }
    
    // If string, parse it
    if (typeof embeddingData === 'string') {
      // Handle both "[1,2,3]" and "1,2,3" formats
      const cleanStr = embeddingData.replace(/^\[|\]$/g, '');
      const values = cleanStr.split(',').map(v => parseFloat(v.trim()));
      
      if (values.some(v => isNaN(v))) {
        return null;
      }
      
      return values;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing embedding data:', error, 'Input:', embeddingData);
    return null;
  }
};

/**
 * Calculate similarity based on metadata overlap
 */
export const calculateMetadataSimilarity = (
  memoryA: VectorMemory,
  memoryB: VectorMemory
): number => {
  const metaA = memoryA.metadata as any;
  const metaB = memoryB.metadata as any;
  
  if (!metaA || !metaB) {
    return 0;
  }

  let matchScore = 0;
  let totalChecks = 0;

  // Category match (high weight)
  if (metaA.category && metaB.category) {
    totalChecks += 3;
    if (metaA.category === metaB.category) {
      matchScore += 3;
    }
  }

  // Emotion match (medium weight)
  if (metaA.emotion && metaB.emotion) {
    totalChecks += 2;
    if (metaA.emotion === metaB.emotion) {
      matchScore += 2;
    }
  }

  // Timestamp proximity (low weight)
  if (metaA.timestamp && metaB.timestamp) {
    totalChecks += 1;
    const timeA = parseTimestamp(metaA.timestamp);
    const timeB = parseTimestamp(metaB.timestamp);
    
    if (timeA !== null && timeB !== null) {
      const timeDiff = Math.abs(timeA - timeB);
      if (timeDiff < 30) { // Within 30 seconds
        matchScore += 1;
      } else if (timeDiff < 120) { // Within 2 minutes  
        matchScore += 0.5;
      }
    }
  }

  return totalChecks > 0 ? matchScore / totalChecks : 0;
};

/**
 * Parse timestamp string to seconds
 */
export const parseTimestamp = (timestamp: string): number | null => {
  try {
    // Handle formats like "1:23", "2:15-2:30", "0:45"
    const cleanTime = timestamp.split('-')[0]?.trim();
    if (!cleanTime) return null;
    
    const parts = cleanTime.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]!, 10);
      const seconds = parseInt(parts[1]!, 10);
      return minutes * 60 + seconds;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Calculate combined similarity score using both semantic and metadata factors
 */
export const calculateCombinedSimilarity = (
  memoryA: VectorMemory,
  memoryB: VectorMemory
): number => {
  const semanticSim = calculateSentenceSimilarity(memoryA, memoryB);
  const metadataSim = calculateMetadataSimilarity(memoryA, memoryB);
  
  // Weight semantic similarity higher than metadata
  return (semanticSim * 0.7) + (metadataSim * 0.3);
};