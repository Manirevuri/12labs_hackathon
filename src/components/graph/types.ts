import type { VectorMemory } from '@/lib/db';

export interface GraphNode {
  id: string;
  type: 'video' | 'sentence' | 'category';
  x: number;
  y: number;
  data: VectorMemory | VideoNodeData | CategoryNodeData;
  size: number;
  color: string;
  isHovered: boolean;
  isDragging: boolean;
}

export interface VideoNodeData {
  id: string;
  videoId: string;
  indexId: string;
  title?: string;
  totalSentences: number;
}

export interface CategoryNodeData {
  id: string;
  category: 'topic' | 'entity' | 'action' | 'dialogue' | 'description' | 'emotion' | 'brand' | 'setting';
  count: number;
  videoId: string;
  indexId: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
  visualProps: {
    opacity: number;
    thickness: number;
    glow: number;
    pulseDuration: number;
  };
  color: string;
  edgeType: 'video-sentence' | 'sentence-sentence' | 'category-sentence' | 'video-category';
  metadata?: {
    category?: string;
    importance?: number;
    timestamp?: string;
  };
}

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  panX: number;
  panY: number;
  zoom: number;
  width: number;
  height: number;
  onNodeHover: (nodeId: string | null) => void;
  onNodeClick: (nodeId: string) => void;
  onNodeDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onNodeDragMove: (e: React.MouseEvent) => void;
  onNodeDragEnd: () => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  draggingNodeId: string | null;
  highlightSentences?: string[];
  searchQuery?: string;
}

export interface VideoMemoryGraphProps {
  videoId: string;
  indexId: string;
  searchQuery?: string;
  filterCategory?: string;
  highlightSentences?: string[];
  onSentenceClick?: (sentence: VectorMemory) => void;
  className?: string;
}

export interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCenter: () => void;
  onSearch: (query: string) => void;
  searchQuery?: string;
}

export interface GraphLegendProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hoveredNode?: string | null;
}