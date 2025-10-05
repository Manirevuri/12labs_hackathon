'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  ConnectionMode,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, MessageCircle, Video, Play, Star } from 'lucide-react';
import { useTwelveLabs } from '@/lib/hooks/useTwelveLabs';
import { IndexSelector } from '@/components/IndexSelector';

interface SearchResult {
  id: string;
  score: number;
  start: number;
  end: number;
  metadata: {
    video_id: string;
    filename: string;
    duration: number;
  };
  thumbnailUrl?: string;
}


export default function ChatPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { loading, error, searchVideos } = useTwelveLabs();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedIndex) return;

    try {
      const results = await searchVideos(searchQuery, ['visual', 'audio'], selectedIndex);
      setSearchResults(results.results);
      
      // Group results by video
      const groupedByVideo = results.results.reduce((acc, result) => {
        const videoId = result.metadata?.video_id;
        if (!acc[videoId]) {
          acc[videoId] = [];
        }
        acc[videoId].push(result);
        return acc;
      }, {} as Record<string, SearchResult[]>);

      // Create nodes and edges for each individual embedding
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      let yOffset = 0;
      const videoSpacing = 300;

      Object.entries(groupedByVideo).forEach(([videoId, moments]) => {
        const randomVideoId = Math.random().toString(36).substring(7);
        
        // Create video root node (center)
        const videoNodeId = `video-${videoId}-${randomVideoId}`;
        console.log('Creating video node:', videoNodeId);
        const videoNode = {
          id: videoNodeId,
          type: 'default',
          position: { x: 400, y: yOffset + 150 },
          data: {
            filename: moments[0]?.metadata?.filename || `Video ${videoId}`,
            videoId,
            totalResults: moments.length,
            thumbnailUrl: moments[0]?.thumbnailUrl
          },
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: '2px solid #4f46e5',
            borderRadius: '12px',
            width: 200,
            height: 80,
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 10
          }
        };
        newNodes.push(videoNode);

        // Create individual embedding nodes in a vertical column to the right of the video
        const nodeSpacing = 80; // Vertical spacing between moment nodes
        const startY = yOffset + 50; // Start above the video center
        
        moments.forEach((moment, momentIndex) => {
          const randomMomentId = Math.random().toString(36).substring(7);
          const x = 650; // Fixed X position to the right of video
          const y = startY + (momentIndex * nodeSpacing);

          const momentNode = {
            id: `moment-${moment.id}-${randomMomentId}`,
            type: 'default',
            position: { x, y },
            data: {
              start: moment.start,
              end: moment.end,
              score: moment.score,
              videoId: moment.metadata?.video_id,
              thumbnailUrl: moment.thumbnailUrl
            },
            style: {
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: '1px solid #ec4899',
              borderRadius: '8px',
              width: 100,
              height: 60,
              fontSize: '9px'
            }
          };
          newNodes.push(momentNode);

          // Create edge from video to each individual embedding with unique ID
          const edge: Edge = {
            id: `edge-${videoId}-${moment.id}-${randomMomentId}`,
            source: videoNodeId,
            target: `moment-${moment.id}-${randomMomentId}`,
            type: 'smoothstep',
            animated: true,
            style: { 
              stroke: '#6366f1', 
              strokeWidth: 3,
              strokeOpacity: 0.8 
            }
          };
          console.log('Creating edge:', edge.source, '->', edge.target);
          newEdges.push(edge);
        });

        // Calculate spacing based on number of moment nodes in vertical layout
        const momentHeight = moments.length * 80; // nodeSpacing * number of moments
        yOffset += Math.max(videoSpacing, momentHeight + 100); // Ensure enough space for all moments
      });

      console.log('Setting nodes:', newNodes.length, 'nodes');
      console.log('Setting edges:', newEdges.length, 'edges');
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Custom node types
  const nodeTypes = useMemo(() => ({
    default: ({ data, id }: { data: any; id: string }) => {
      const isVideo = id.startsWith('video-');
      
      if (isVideo) {
        return (
          <div className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg border border-blue-400 shadow-md">
            <Handle
              type="source"
              position={Position.Right}
              style={{ background: '#6366f1' }}
            />
            <div className="flex items-center gap-1 mb-1">
              <Video className="h-3 w-3" />
              <span className="font-bold text-xs truncate">{data.filename}</span>
            </div>
            <div className="text-xs opacity-90">
              {data.totalResults} clips
            </div>
          </div>
        );
      } else {
        return (
          <div className="relative p-1 bg-gradient-to-br from-pink-500 to-red-500 text-white rounded border border-pink-400 shadow-sm">
            <Handle
              type="target"
              position={Position.Left}
              style={{ background: '#ec4899' }}
            />
            <div className="flex items-center gap-1 mb-1">
              <Play className="h-2 w-2" />
              <span className="text-xs font-medium">
                {formatTime(data.start)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-2 w-2 text-yellow-300" />
              <span className="text-xs">{data.score.toFixed(0)}%</span>
            </div>
          </div>
        );
      }
    }
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="h-screen flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50">
          {/* Left: Title and Search */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-300" />
              <h1 className="text-lg font-bold text-white">Video Search Flow</h1>
            </div>
            
            {selectedIndex && (
              <div className="flex items-center gap-3 flex-1 max-w-lg">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search for moments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all text-sm"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim() || !selectedIndex}
                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Index Selection */}
          <div className="flex items-center gap-3">
            {searchResults.length > 0 && (
              <div className="text-xs text-gray-400">
                {searchResults.length} moments, {new Set(searchResults.map(r => r.metadata?.video_id)).size} videos
              </div>
            )}
            <div className="w-64">
              <IndexSelector
                selectedIndex={selectedIndex}
                onIndexSelect={setSelectedIndex}
                className="w-full"
                placeholder="Select index..."
              />
            </div>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
            className="bg-gray-900"
          >
            <Background color="#6366f1" gap={20} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => node.id.startsWith('video-') ? '#667eea' : '#f093fb'}
              className="bg-gray-800"
            />
          </ReactFlow>

          {/* Empty State */}
          {!selectedIndex && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Select an Index to Start
                </h3>
                <p className="text-gray-400">
                  Choose an index and search to see video moments as connected nodes
                </p>
              </div>
            </div>
          )}

          {selectedIndex && searchResults.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Search to Explore
                </h3>
                <p className="text-gray-400">
                  Enter a search query to visualize video moments as connected nodes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-4 right-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 max-w-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}