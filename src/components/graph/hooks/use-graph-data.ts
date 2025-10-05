"use client";

import { useMemo } from 'react';
import type { VectorMemory } from '@/lib/db';
import type { GraphNode, GraphEdge, VideoNodeData, CategoryNodeData } from '../types';
import { 
  colors, 
  LAYOUT_CONSTANTS, 
  getNodeColor, 
  getSentenceSize, 
  getConnectionVisualProps,
  getEdgeColor 
} from '../constants';
import { calculateCombinedSimilarity } from '../similarity';

export function useGraphData(
  memories: VectorMemory[],
  videoId: string,
  indexId: string,
  nodePositions: Map<string, { x: number; y: number }>,
  draggingNodeId: string | null,
  searchQuery?: string,
  filterCategory?: string
) {
  return useMemo(() => {
    console.log(`useGraphData: Processing ${memories?.length || 0} memories`);
    
    if (!memories || memories.length === 0) {
      console.log('useGraphData: No memories to process');
      return { nodes: [], edges: [] };
    }

    const allNodes: GraphNode[] = [];
    const allEdges: GraphEdge[] = [];

    // Filter memories based on category filter
    const filteredMemories = filterCategory 
      ? memories.filter(memory => {
          const metadata = memory.metadata as any;
          return metadata?.category === filterCategory;
        })
      : memories;

    // Group memories by category for analysis
    const categoryCounts = new Map<string, number>();
    filteredMemories.forEach(memory => {
      const metadata = memory.metadata as any;
      const category = metadata?.category || 'description';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    // Create central video node
    const videoNodeData: VideoNodeData = {
      id: `video-${videoId}`,
      videoId,
      indexId,
      title: `Video Analysis`,
      totalSentences: filteredMemories.length
    };

    const customVideoPos = nodePositions.get(videoNodeData.id);
    const videoNode: GraphNode = {
      id: videoNodeData.id,
      type: 'video',
      x: customVideoPos?.x ?? LAYOUT_CONSTANTS.centerX,
      y: customVideoPos?.y ?? LAYOUT_CONSTANTS.centerY,
      data: videoNodeData,
      size: LAYOUT_CONSTANTS.videoNodeSize,
      color: getNodeColor('video'),
      isHovered: false,
      isDragging: draggingNodeId === videoNodeData.id,
    };

    allNodes.push(videoNode);

    // Create category nodes in a circle around the video
    const categoryNodes: GraphNode[] = [];
    let categoryIndex = 0;
    
    categoryCounts.forEach((count, category) => {
      const categoryId = `category-${category}`;
      const categoryAngle = (categoryIndex / categoryCounts.size) * Math.PI * 2;
      const categoryX = videoNode.x + Math.cos(categoryAngle) * LAYOUT_CONSTANTS.categoryClusterRadius;
      const categoryY = videoNode.y + Math.sin(categoryAngle) * LAYOUT_CONSTANTS.categoryClusterRadius;

      const customCategoryPos = nodePositions.get(categoryId);
      const categoryNodeData: CategoryNodeData = {
        id: categoryId,
        category: category as any,
        count,
        videoId,
        indexId
      };

      const categoryNode: GraphNode = {
        id: categoryId,
        type: 'category',
        x: customCategoryPos?.x ?? categoryX,
        y: customCategoryPos?.y ?? categoryY,
        data: categoryNodeData,
        size: LAYOUT_CONSTANTS.categoryNodeSize,
        color: getNodeColor('sentence', category),
        isHovered: false,
        isDragging: draggingNodeId === categoryId,
      };

      categoryNodes.push(categoryNode);
      allNodes.push(categoryNode);

      // Create edge from video to category
      allEdges.push({
        id: `video-category-${category}`,
        source: videoNode.id,
        target: categoryId,
        similarity: Math.min(count / 10, 1), // Scale by count
        visualProps: getConnectionVisualProps(Math.min(count / 10, 1)),
        color: getEdgeColor('video-category', Math.min(count / 10, 1)),
        edgeType: 'video-category',
        metadata: { category, importance: count / filteredMemories.length }
      });

      categoryIndex++;
    });

    // Create sentence nodes clustered around their categories
    const sentenceNodes: GraphNode[] = [];
    const sentencesByCategory = new Map<string, VectorMemory[]>();
    
    // Group sentences by category
    filteredMemories.forEach(memory => {
      const metadata = memory.metadata as any;
      const category = metadata?.category || 'description';
      
      if (!sentencesByCategory.has(category)) {
        sentencesByCategory.set(category, []);
      }
      sentencesByCategory.get(category)!.push(memory);
    });

    // Position sentences around their category nodes
    sentencesByCategory.forEach((memories, category) => {
      const categoryNode = categoryNodes.find(node => 
        (node.data as CategoryNodeData).category === category
      );
      
      if (!categoryNode) return;

      memories.forEach((memory, memoryIndex) => {
        const metadata = memory.metadata as any;
        const importance = metadata?.importance || memory.confidence || 0.5;
        
        // Create spiral layout around category
        const spiralAngle = (memoryIndex / memories.length) * Math.PI * 4; // Multiple spirals
        const spiralRadius = LAYOUT_CONSTANTS.sentenceClusterRadius * 
                           (0.3 + (memoryIndex % 3) * 0.3); // Vary radius
        
        const sentenceX = categoryNode.x + Math.cos(spiralAngle) * spiralRadius;
        const sentenceY = categoryNode.y + Math.sin(spiralAngle) * spiralRadius;

        const customSentencePos = nodePositions.get(memory.id);
        
        const sentenceNode: GraphNode = {
          id: memory.id,
          type: 'sentence',
          x: customSentencePos?.x ?? sentenceX,
          y: customSentencePos?.y ?? sentenceY,
          data: memory,
          size: getSentenceSize(memory.sentence, importance),
          color: getNodeColor('sentence', category),
          isHovered: false,
          isDragging: draggingNodeId === memory.id,
        };

        sentenceNodes.push(sentenceNode);
        allNodes.push(sentenceNode);

        // Create edge from category to sentence
        allEdges.push({
          id: `category-sentence-${categoryNode.id}-${memory.id}`,
          source: categoryNode.id,
          target: memory.id,
          similarity: importance,
          visualProps: getConnectionVisualProps(importance),
          color: getEdgeColor('category-sentence', importance),
          edgeType: 'category-sentence',
          metadata: { 
            category, 
            importance, 
            timestamp: metadata?.timestamp 
          }
        });
      });
    });

    // Create similarity edges between sentences
    const similarityThreshold = LAYOUT_CONSTANTS.minSimilarityThreshold;
    
    for (let i = 0; i < sentenceNodes.length; i++) {
      const nodeA = sentenceNodes[i]!;
      const memoryA = nodeA.data as VectorMemory;
      
      for (let j = i + 1; j < sentenceNodes.length; j++) {
        const nodeB = sentenceNodes[j]!;
        const memoryB = nodeB.data as VectorMemory;
        
        const similarity = calculateCombinedSimilarity(memoryA, memoryB);
        
        if (similarity > similarityThreshold) {
          allEdges.push({
            id: `similarity-${nodeA.id}-${nodeB.id}`,
            source: nodeA.id,
            target: nodeB.id,
            similarity,
            visualProps: getConnectionVisualProps(similarity),
            color: getEdgeColor('sentence-sentence', similarity),
            edgeType: 'sentence-sentence',
            metadata: {
              importance: similarity,
            }
          });
        }
      }
    }

    // Highlight search matches if query provided
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      sentenceNodes.forEach(node => {
        const memory = node.data as VectorMemory;
        if (memory.sentence.toLowerCase().includes(query)) {
          // Create search highlight edge to video
          allEdges.push({
            id: `search-${videoNode.id}-${node.id}`,
            source: videoNode.id,
            target: node.id,
            similarity: 1.0,
            visualProps: {
              opacity: 0.9,
              thickness: 3,
              glow: 0.8,
              pulseDuration: 1000,
            },
            color: getEdgeColor('search', 1.0),
            edgeType: 'video-sentence',
            metadata: { importance: 1.0 }
          });
        }
      });
    }

    // Apply collision avoidance for sentence nodes
    applyCollisionAvoidance(sentenceNodes, LAYOUT_CONSTANTS.minSentenceDistance);

    console.log(`useGraphData: Created ${allNodes.length} nodes and ${allEdges.length} edges`);
    console.log(`Node types: Video: ${allNodes.filter(n => n.type === 'video').length}, Category: ${allNodes.filter(n => n.type === 'category').length}, Sentence: ${allNodes.filter(n => n.type === 'sentence').length}`);
    
    return { nodes: allNodes, edges: allEdges };
  }, [
    memories, 
    videoId, 
    indexId, 
    nodePositions, 
    draggingNodeId, 
    searchQuery, 
    filterCategory
  ]);
}

/**
 * Apply gentle collision avoidance between nodes
 */
function applyCollisionAvoidance(nodes: GraphNode[], minDistance: number) {
  const iterations = 3;
  
  for (let iter = 0; iter < iterations; iter++) {
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i >= j) return;
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        if (dist < minDistance) {
          const push = (minDistance - dist) / 4; // Gentle push
          const nx = dx / dist;
          const ny = dy / dist;
          
          nodeA.x -= nx * push;
          nodeA.y -= ny * push;
          nodeB.x += nx * push;
          nodeB.y += ny * push;
        }
      });
    });
  }
}