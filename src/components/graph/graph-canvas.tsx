"use client";

import { memo, useCallback, useRef } from 'react';
import type { GraphCanvasProps, GraphNode, GraphEdge, VectorMemory, VideoNodeData, CategoryNodeData } from './types';
import { colors } from './constants';

export const GraphCanvas = memo<GraphCanvasProps>(({
  nodes,
  edges,
  panX,
  panY,
  zoom,
  width,
  height,
  onNodeHover,
  onNodeClick,
  onNodeDragStart,
  onNodeDragMove,
  onNodeDragEnd,
  onPanStart,
  onPanMove,
  onPanEnd,
  onWheel,
  onDoubleClick,
  draggingNodeId,
  highlightSentences = [],
  searchQuery,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Get node at position for hover/click detection
  const getNodeAtPosition = useCallback((clientX: number, clientY: number): string | null => {
    if (!svgRef.current) return null;
    
    const rect = svgRef.current.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldX = (localX - panX) / zoom;
    const worldY = (localY - panY) / zoom;
    
    // Check nodes in reverse order (top to bottom)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]!;
      const distance = Math.sqrt(
        Math.pow(worldX - node.x, 2) + Math.pow(worldY - node.y, 2)
      );
      
      if (distance <= node.size / 2) {
        return node.id;
      }
    }
    
    return null;
  }, [nodes, panX, panY, zoom]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) {
      onNodeDragMove(e);
    } else {
      onPanMove(e);
    }
    
    // Update hover state
    const nodeId = getNodeAtPosition(e.clientX, e.clientY);
    onNodeHover(nodeId);
  }, [draggingNodeId, onNodeDragMove, onPanMove, getNodeAtPosition, onNodeHover]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const nodeId = getNodeAtPosition(e.clientX, e.clientY);
    
    if (nodeId) {
      onNodeDragStart(nodeId, e);
    } else {
      onPanStart(e);
    }
  }, [getNodeAtPosition, onNodeDragStart, onPanStart]);

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      onNodeDragEnd();
    } else {
      onPanEnd();
    }
  }, [draggingNodeId, onNodeDragEnd, onPanEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const nodeId = getNodeAtPosition(e.clientX, e.clientY);
    if (nodeId) {
      onNodeClick(nodeId);
    }
  }, [getNodeAtPosition, onNodeClick]);

  // Render a single node
  const renderNode = useCallback((node: GraphNode) => {
    const isHighlighted = highlightSentences.includes(node.id);
    const isSearchMatch = searchQuery && node.type === 'sentence' && 
      (node.data as VectorMemory).sentence.toLowerCase().includes(searchQuery.toLowerCase());
    
    let nodeContent;
    let nodeStroke = node.color;
    let nodeStrokeWidth = 2;
    
    if (isHighlighted || isSearchMatch) {
      nodeStroke = colors.connection.search;
      nodeStrokeWidth = 3;
    }
    
    if (node.isDragging) {
      nodeStrokeWidth = 4;
    }

    switch (node.type) {
      case 'video':
        const videoData = node.data as VideoNodeData;
        nodeContent = (
          <g>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size / 2}
              fill={node.color}
              stroke={nodeStroke}
              strokeWidth={nodeStrokeWidth}
              opacity={node.isHovered ? 0.8 : 0.9}
            />
            <text
              x={node.x}
              y={node.y - 5}
              textAnchor="middle"
              fill={colors.text.primary}
              fontSize="12"
              fontWeight="bold"
            >
              Video
            </text>
            <text
              x={node.x}
              y={node.y + 8}
              textAnchor="middle"
              fill={colors.text.secondary}
              fontSize="10"
            >
              {videoData.totalSentences} memories
            </text>
          </g>
        );
        break;
        
      case 'category':
        const categoryData = node.data as CategoryNodeData;
        nodeContent = (
          <g>
            <rect
              x={node.x - node.size / 2}
              y={node.y - node.size / 2}
              width={node.size}
              height={node.size}
              rx={8}
              fill={node.color}
              stroke={nodeStroke}
              strokeWidth={nodeStrokeWidth}
              opacity={node.isHovered ? 0.8 : 0.9}
            />
            <text
              x={node.x}
              y={node.y - 5}
              textAnchor="middle"
              fill={colors.text.primary}
              fontSize="10"
              fontWeight="bold"
            >
              {categoryData.category}
            </text>
            <text
              x={node.x}
              y={node.y + 8}
              textAnchor="middle"
              fill={colors.text.secondary}
              fontSize="8"
            >
              {categoryData.count}
            </text>
          </g>
        );
        break;
        
      case 'sentence':
        const sentenceData = node.data as VectorMemory;
        const maxTextLength = Math.floor(node.size / 3);
        const displayText = sentenceData.sentence.length > maxTextLength 
          ? sentenceData.sentence.substring(0, maxTextLength) + '...'
          : sentenceData.sentence;
          
        nodeContent = (
          <g>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size / 2}
              fill={node.color}
              stroke={nodeStroke}
              strokeWidth={nodeStrokeWidth}
              opacity={node.isHovered ? 0.8 : 0.7}
            />
            {node.size > 40 && (
              <text
                x={node.x}
                y={node.y + 3}
                textAnchor="middle"
                fill={colors.text.primary}
                fontSize={Math.min(10, node.size / 4)}
                fontWeight="normal"
              >
                {displayText.split(' ').slice(0, 3).join(' ')}
              </text>
            )}
          </g>
        );
        break;
        
      default:
        nodeContent = (
          <circle
            cx={node.x}
            cy={node.y}
            r={node.size / 2}
            fill={node.color}
            stroke={nodeStroke}
            strokeWidth={nodeStrokeWidth}
            opacity={0.7}
          />
        );
    }

    return (
      <g key={node.id} style={{ cursor: 'pointer' }}>
        {nodeContent}
      </g>
    );
  }, [highlightSentences, searchQuery]);

  // Render a single edge
  const renderEdge = useCallback((edge: GraphEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return null;

    const isSearchEdge = edge.edgeType === 'video-sentence' && searchQuery;
    let strokeDasharray = undefined;
    
    // Different line styles for different edge types
    switch (edge.edgeType) {
      case 'sentence-sentence':
        strokeDasharray = '5,5';
        break;
      case 'category-sentence':
        strokeDasharray = '3,3';
        break;
      default:
        strokeDasharray = undefined;
    }

    return (
      <line
        key={edge.id}
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke={edge.color}
        strokeWidth={edge.visualProps.thickness}
        strokeOpacity={edge.visualProps.opacity}
        strokeDasharray={strokeDasharray}
        style={{
          filter: edge.visualProps.glow > 0 ? `drop-shadow(0 0 ${edge.visualProps.glow * 3}px ${edge.color})` : undefined
        }}
      />
    );
  }, [nodes, searchQuery]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        backgroundColor: colors.background.primary,
        cursor: draggingNodeId ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
    >
      {/* Transform group for pan and zoom */}
      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
        {/* Render grid */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke={colors.background.secondary}
              strokeWidth="1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect
          x="-5000"
          y="-5000"
          width="10000"
          height="10000"
          fill="url(#grid)"
        />
        
        {/* Render edges first (behind nodes) */}
        {edges.map(renderEdge)}
        
        {/* Render nodes */}
        {nodes.map(renderNode)}
      </g>
    </svg>
  );
});

GraphCanvas.displayName = 'GraphCanvas';