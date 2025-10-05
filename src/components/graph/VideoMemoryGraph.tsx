"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VectorMemory } from '@/lib/db';
import type { VideoMemoryGraphProps, GraphNode } from './types';
import { GraphCanvas } from './graph-canvas';
import { useGraphData } from './hooks/use-graph-data';
import { useGraphInteractions } from './hooks/use-graph-interactions';
import { colors } from './constants';
import { Brain, Search, Filter, ZoomIn, ZoomOut, RotateCcw, Navigation } from 'lucide-react';

export function VideoMemoryGraph({
  videoId,
  indexId,
  searchQuery,
  filterCategory,
  highlightSentences = [],
  onSentenceClick,
  className = '',
}: VideoMemoryGraphProps) {
  const [memories, setMemories] = useState<VectorMemory[]>([]);
  const [hasLoadedMemories, setHasLoadedMemories] = useState(false);
  
  // Log when memories state changes
  useEffect(() => {
    console.log('VideoMemoryGraph: memories state changed to:', memories.length, 'items');
  }, [memories]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(filterCategory || '');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Graph interactions
  const {
    panX,
    panY,
    zoom,
    hoveredNode,
    selectedNode,
    draggingNodeId,
    nodePositions,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleWheel,
    handleNodeHover,
    handleNodeClick,
    handleNodeDragStart,
    handleNodeDragMove,
    handleNodeDragEnd,
    handleDoubleClick,
    setSelectedNode,
    zoomIn,
    zoomOut,
    autoFitToViewport,
  } = useGraphInteractions();

  // Graph data
  const { nodes, edges } = useGraphData(
    memories,
    videoId,
    indexId,
    nodePositions,
    draggingNodeId,
    localSearchQuery,
    selectedCategory
  );

  // Function to load vector memories (called manually via button)
  const loadMemories = async () => {
    console.log('VideoMemoryGraph: Starting to load memories for video:', videoId, 'index:', indexId);
    setLoading(true);
    setError(null);
    
    try {
      console.log('VideoMemoryGraph: About to check vector status');
      // Check if vectors exist
      const statusResponse = await fetch(
        `/api/vector/status?videoId=${videoId}&indexId=${indexId}`
      );
      console.log('VideoMemoryGraph: Got status response:', statusResponse.ok);
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check vector status');
      }
      
      const statusData = await statusResponse.json();
      
      if (!statusData.hasVectors) {
        // No vectors exist, try to process analysis
        console.log('No vectors found, processing analysis...');
        
        const processResponse = await fetch('/api/vector/process-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, indexId })
        });
        
        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.error || 'Failed to process analysis');
        }
        
        console.log('Analysis processed successfully');
      }
      
      console.log('VideoMemoryGraph: About to search for memories');
      // Search for all memories for this video/index using a very broad approach
      const searchResponse = await fetch('/api/vector/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'content video analysis scene action description emotion', // Very broad query
          videoId,
          indexId,
          limit: 200,
          threshold: 0.01, // Very low threshold to get ALL memories
        })
      });
      
      console.log('VideoMemoryGraph: Got search response:', searchResponse.ok, searchResponse.status);
      
      if (!searchResponse.ok) {
        console.log('VideoMemoryGraph: Search response not ok, throwing error');
        throw new Error('Failed to search vector memories');
      }
      
      const searchData = await searchResponse.json();
      console.log('VideoMemoryGraph: Raw search response:', searchData);
      console.log(`VideoMemoryGraph: Received ${searchData.results?.length || 0} memories from search`);
      console.log('Sample memories:', searchData.results?.slice(0, 2));
      console.log('VideoMemoryGraph: About to call setMemories with:', searchData.results?.length || 0, 'items');
      setMemories(searchData.results || []);
      setHasLoadedMemories(true);
      console.log('VideoMemoryGraph: setMemories called successfully');
      
    } catch (err) {
      console.error('Error loading memories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-fit graph when nodes load
  useEffect(() => {
    if (nodes.length > 0 && containerSize.width > 0 && containerSize.height > 0) {
      // Small delay to allow layout to settle
      setTimeout(() => {
        autoFitToViewport(nodes, containerSize.width, containerSize.height);
      }, 100);
    }
  }, [nodes.length, containerSize, autoFitToViewport]);

  // Handle node clicks
  const handleNodeClickInternal = useCallback((nodeId: string) => {
    handleNodeClick(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.type === 'sentence' && onSentenceClick) {
      onSentenceClick(node.data as VectorMemory);
    }
  }, [handleNodeClick, nodes, onSentenceClick]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setLocalSearchQuery(query);
  }, []);

  // Category filter handler
  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  }, [selectedCategory]);

  // Navigation controls
  const handleZoomIn = useCallback(() => {
    zoomIn(containerSize.width / 2, containerSize.height / 2);
  }, [zoomIn, containerSize]);

  const handleZoomOut = useCallback(() => {
    zoomOut(containerSize.width / 2, containerSize.height / 2);
  }, [zoomOut, containerSize]);

  const handleResetView = useCallback(() => {
    if (nodes.length > 0) {
      autoFitToViewport(nodes, containerSize.width, containerSize.height);
    }
  }, [nodes, containerSize, autoFitToViewport]);

  // Get unique categories for filter
  const availableCategories = Array.from(new Set(
    memories.map(m => (m.metadata as any)?.category).filter(Boolean)
  ));

  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-gray-300">Loading memory graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center text-red-400">
          <p className="mb-2">Error loading memory graph:</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasLoadedMemories && memories.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400" />
          <p className="text-lg font-medium mb-2">Memory Graph</p>
          <p className="text-sm mb-6">Load memories to explore semantic relationships and connections</p>
          <button
            onClick={loadMemories}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <Brain className="h-5 w-5" />
            {loading ? 'Loading Memories...' : 'Load Memory Graph'}
          </button>
        </div>
      </div>
    );
  }

  if (hasLoadedMemories && memories.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-4" />
          <p className="mb-2">No memories found</p>
          <p className="text-sm">Analyze the video first to create memory graph</p>
          <button
            onClick={loadMemories}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            {loading ? 'Retrying...' : 'Retry Loading'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Search and Filter Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search memories..."
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-transparent text-white text-sm placeholder-gray-400 outline-none w-40"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All Categories</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Graph Info */}
      <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg px-3 py-2">
        <div className="text-white text-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span>{memories.length} memories</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {nodes.filter(n => n.type === 'sentence').length} sentences • {nodes.filter(n => n.type === 'category').length} categories
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div ref={containerRef} className="w-full h-full">
        {containerSize.width > 0 && (
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            panX={panX}
            panY={panY}
            zoom={zoom}
            width={containerSize.width}
            height={containerSize.height}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClickInternal}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragMove={handleNodeDragMove}
            onNodeDragEnd={handleNodeDragEnd}
            onPanStart={handlePanStart}
            onPanMove={handlePanMove}
            onPanEnd={handlePanEnd}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            draggingNodeId={draggingNodeId}
            highlightSentences={highlightSentences}
            searchQuery={localSearchQuery}
          />
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 bg-gray-800 rounded-lg p-4 max-w-sm">
          {(() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;

            switch (node.type) {
              case 'sentence':
                const memory = node.data as VectorMemory;
                const metadata = memory.metadata as any;
                return (
                  <div>
                    <h4 className="text-white font-medium mb-2">Memory Detail</h4>
                    <p className="text-gray-300 text-sm mb-2">{memory.sentence}</p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Category: <span className="text-white">{metadata?.category}</span></div>
                      <div>Confidence: <span className="text-white">{(memory.confidence || 0).toFixed(2)}</span></div>
                      {metadata?.timestamp && (
                        <div>Timestamp: <span className="text-white">{metadata.timestamp}</span></div>
                      )}
                      {metadata?.emotion && (
                        <div>Emotion: <span className="text-white">{metadata.emotion}</span></div>
                      )}
                    </div>
                  </div>
                );
              case 'category':
                const categoryData = node.data as any;
                return (
                  <div>
                    <h4 className="text-white font-medium mb-2">Category</h4>
                    <p className="text-gray-300 text-sm mb-2">{categoryData.category}</p>
                    <div className="text-xs text-gray-400">
                      <div>Memories: <span className="text-white">{categoryData.count}</span></div>
                    </div>
                  </div>
                );
              case 'video':
                const videoData = node.data as any;
                return (
                  <div>
                    <h4 className="text-white font-medium mb-2">Video Analysis</h4>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Total Memories: <span className="text-white">{videoData.totalSentences}</span></div>
                      <div>Video ID: <span className="text-white">{videoData.videoId.slice(0, 8)}...</span></div>
                    </div>
                  </div>
                );
              default:
                return null;
            }
          })()}
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}