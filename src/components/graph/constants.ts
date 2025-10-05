export const colors = {
  background: {
    primary: '#0F1419',
    secondary: '#1A1F2E',
  },
  video: {
    primary: '#8B5CF6',
    hover: '#A78BFA',
    border: '#7C3AED',
  },
  sentence: {
    topic: '#EF4444',
    entity: '#3B82F6', 
    action: '#10B981',
    dialogue: '#F59E0B',
    description: '#6B7280',
    emotion: '#EC4899',
    brand: '#DC2626',
    setting: '#059669',
  },
  category: {
    primary: '#4F46E5',
    hover: '#6366F1',
    border: '#4338CA',
  },
  connection: {
    memory: '#374151',
    similarity: '#6B7280',
    category: '#4F46E5',
    search: '#F59E0B',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#64748B',
  }
};

export const LAYOUT_CONSTANTS = {
  centerX: 0,
  centerY: 0,
  
  // Video node positioning
  videoNodeSize: 80,
  videoSpacing: 300,
  
  // Sentence clustering around video
  sentenceClusterRadius: 200,
  sentenceSpacing: 80,
  minSentenceDistance: 60,
  
  // Category positioning  
  categoryClusterRadius: 350,
  categoryNodeSize: 60,
  
  // Edge properties
  minEdgeOpacity: 0.1,
  maxEdgeOpacity: 0.8,
  minEdgeThickness: 1,
  maxEdgeThickness: 4,
  
  // Similarity thresholds
  minSimilarityThreshold: 0.6,
  strongSimilarityThreshold: 0.8,
  
  // Animation
  animationDuration: 300,
  panSensitivity: 1,
  zoomSensitivity: 0.1,
  minZoom: 0.1,
  maxZoom: 5,
};

export const NODE_SIZES = {
  video: 80,
  sentence: {
    small: 32,
    medium: 48, 
    large: 64,
  },
  category: 60,
};

export const getNodeColor = (type: string, category?: string) => {
  switch (type) {
    case 'video':
      return colors.video.primary;
    case 'category':
      return colors.category.primary;
    case 'sentence':
      if (category && category in colors.sentence) {
        return colors.sentence[category as keyof typeof colors.sentence];
      }
      return colors.sentence.description;
    default:
      return colors.sentence.description;
  }
};

export const getSentenceSize = (sentence: string, importance: number = 0.5) => {
  const baseSize = NODE_SIZES.sentence.small;
  const lengthFactor = Math.min(sentence.length / 100, 1);
  const importanceFactor = importance;
  
  const size = baseSize + (lengthFactor * 16) + (importanceFactor * 16);
  return Math.max(NODE_SIZES.sentence.small, Math.min(NODE_SIZES.sentence.large, size));
};

export const getConnectionVisualProps = (similarity: number) => {
  const normalizedSim = Math.max(0, Math.min(1, similarity));
  
  return {
    opacity: LAYOUT_CONSTANTS.minEdgeOpacity + 
             (normalizedSim * (LAYOUT_CONSTANTS.maxEdgeOpacity - LAYOUT_CONSTANTS.minEdgeOpacity)),
    thickness: LAYOUT_CONSTANTS.minEdgeThickness + 
               (normalizedSim * (LAYOUT_CONSTANTS.maxEdgeThickness - LAYOUT_CONSTANTS.minEdgeThickness)),
    glow: normalizedSim * 0.6,
    pulseDuration: 2000 + (1 - normalizedSim) * 3000,
  };
};

export const getEdgeColor = (edgeType: string, similarity: number = 0.5) => {
  const hue = {
    'video-sentence': 220,      // Blue
    'sentence-sentence': 280,   // Purple  
    'category-sentence': 200,   // Light blue
    'video-category': 260,      // Violet
    'search': 45,               // Orange
  }[edgeType] || 220;
  
  const saturation = 60 + similarity * 40; // 60% to 100%
  const lightness = 40 + similarity * 30;  // 40% to 70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};