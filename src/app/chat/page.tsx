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
  ConnectionMode
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
      const newNodes = [];
      const newEdges = [];
      
      let yOffset = 0;
      const videoSpacing = 300;

      Object.entries(groupedByVideo).forEach(([videoId, moments]) => {
        const randomVideoId = Math.random().toString(36).substring(7);
        
        // Create video root node (center)
        const videoNode = {
          id: `video-${videoId}-${randomVideoId}`,
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
            border: '3px solid #4f46e5',
            borderRadius: '16px',
            width: 300,
            height: 140,
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 10
          }
        };
        newNodes.push(videoNode);

        // Create individual embedding nodes in a circle around the video
        const radius = 250;
        const angleStep = (2 * Math.PI) / moments.length;
        
        moments.forEach((moment, momentIndex) => {
          const randomMomentId = Math.random().toString(36).substring(7);
          const angle = momentIndex * angleStep;
          const x = 400 + radius * Math.cos(angle);
          const y = yOffset + 150 + radius * Math.sin(angle);

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
              border: '2px solid #ec4899',
              borderRadius: '12px',
              width: 160,
              height: 90,
              fontSize: '12px'
            }
          };
          newNodes.push(momentNode);

          // Create edge from video to each individual embedding with unique ID
          const edge = {
            id: `edge-${videoId}-${moment.id}-${randomMomentId}`,
            source: `video-${videoId}-${randomVideoId}`,
            target: `moment-${moment.id}-${randomMomentId}`,
            type: 'smoothstep',
            style: { 
              stroke: '#6366f1', 
              strokeWidth: 2,
              strokeOpacity: 0.6 
            },
            animated: true
          };
          newEdges.push(edge);
        });

        yOffset += videoSpacing + (moments.length > 6 ? 400 : 300);
      });

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
          <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl border-2 border-blue-400 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Video className="h-5 w-5" />
              <span className="font-bold text-sm truncate">{data.filename}</span>
            </div>
            <div className="text-xs opacity-90 mb-2">
              {data.totalResults} embeddings found
            </div>
            {data.thumbnailUrl && (
              <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden">
                <img 
                  src={data.thumbnailUrl} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="p-3 bg-gradient-to-br from-pink-500 to-red-500 text-white rounded-lg border-2 border-pink-400 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Play className="h-3 w-3" />
              <span className="text-xs font-medium">
                {formatTime(data.start)} - {formatTime(data.end)}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-3 w-3 text-yellow-300" />
              <span className="text-xs">{data.score.toFixed(1)}%</span>
            </div>
            <div className="text-xs opacity-75">
              Embedding {data.start}s
            </div>
          </div>
        );
      }
    }
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <MessageCircle className="h-6 w-6 text-gray-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Video Search Flow
              </h1>
              <p className="text-gray-300">
                Search videos and explore results as connected nodes
              </p>
            </div>
          </div>

          {/* Index Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Index *
            </label>
            <div className="max-w-md">
              <IndexSelector
                selectedIndex={selectedIndex}
                onIndexSelect={setSelectedIndex}
                className="w-full"
                placeholder="Choose an index to search..."
              />
            </div>
          </div>

          {/* Search Interface */}
          {selectedIndex && (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search for moments in your videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim() || !selectedIndex}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          )}

          {/* Results Summary */}
          {searchResults.length > 0 && (
            <div className="mt-4 text-sm text-gray-400">
              Found {searchResults.length} moments across {new Set(searchResults.map(r => r.metadata?.video_id)).size} videos
            </div>
          )}
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
            fitView
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