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
  const [selectedVideo, setSelectedVideo] = useState<{nodeId: string, url: string, startTime: number, endTime: number} | null>(null);

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
      const videoSpacing = 400; // Increased spacing between video groups

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
            thumbnailUrl: moments[0]?.thumbnailUrl,
            // Store video URL for playback (using test video for now)
            videoUrl: 'https://54hvaaxenz1kxrx4.public.blob.vercel-storage.com/test_video_2-p70ZLKG1LDfR54791Ztjse507CGwug.mp4'
          },
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: '2px solid #4f46e5',
            borderRadius: '12px',
            width: 320,
            height: 240,
            fontSize: '11px',
            fontWeight: 'bold',
            zIndex: 10
          }
        };
        newNodes.push(videoNode);

        // Create individual embedding nodes in a vertical column to the right of the video
        const nodeHeight = 120; // Height of embedding nodes
        const nodeSpacing = nodeHeight + 20; // Add 20px gap between nodes
        const videoWidth = 320;
        const videoX = 400;
        const gap = 100; // Gap between video and embedding nodes
        const embeddingX = videoX + videoWidth + gap; // Position embeddings with gap from video
        const startY = yOffset + 50; // Start above the video center
        
        moments.forEach((moment, momentIndex) => {
          const randomMomentId = Math.random().toString(36).substring(7);
          const x = embeddingX; // Position with proper spacing from video
          const y = startY + (momentIndex * nodeSpacing);

          const momentNode = {
            id: `moment-${moment.id}-${randomMomentId}`,
            type: 'default',
            position: { x, y },
            data: {
              start: moment.start || 0,
              end: moment.end || (moment.start + 10),
              score: moment.score,
              videoId: moment.metadata?.video_id,
              thumbnailUrl: moment.thumbnailUrl
            },
            style: {
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: '1px solid #9ca3af',
              borderRadius: '8px',
              width: 180,
              height: 120,
              fontSize: '10px',
              cursor: 'pointer'
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
        const totalMomentHeight = moments.length * nodeSpacing; // Total height of all moment nodes
        yOffset += Math.max(videoSpacing, totalMomentHeight + 100); // Ensure enough space for all moments
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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // If clicking an embedding node, set video to play from that timestamp
    if (node.id.startsWith('moment-')) {
      const videoNode = nodes.find(n => n.id.startsWith('video-') && 
        edges.some(e => e.source === n.id && e.target === node.id));
      
      if (videoNode?.data.videoUrl) {
        setSelectedVideo({
          nodeId: videoNode.id, // Use the specific video node ID
          url: videoNode.data.videoUrl,
          startTime: node.data.start || 0,
          endTime: node.data.end || node.data.start + 10 // Default to 10 seconds if no end time
        });
      }
    }
    // If clicking a video node, play the full video
    else if (node.id.startsWith('video-') && node.data.videoUrl) {
      setSelectedVideo({
        nodeId: node.id, // Use the specific video node ID
        url: node.data.videoUrl,
        startTime: 0,
        endTime: Infinity // Play full video
      });
    }
  }, [nodes, edges]);

  // Custom node types
  const nodeTypes = useMemo(() => ({
    default: ({ data, id }: { data: any; id: string }) => {
      const isVideo = id.startsWith('video-');
      
      if (isVideo) {
        return (
          <div className="relative rounded-lg shadow-2xl" style={{ width: 320, height: 240 }}>
            {/* Backdrop/overlay effect */}
            <div className="absolute inset-0 bg-black/20 rounded-lg backdrop-blur-sm -z-10" style={{ padding: '4px' }}>
              <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-lg" />
            </div>
            
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg border-2 border-blue-400 shadow-md overflow-hidden w-full h-full">
              <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#6366f1', width: 12, height: 12 }}
              />
              {data.videoUrl ? (
                <video
                  key={`${id}-${selectedVideo?.startTime || 0}`}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay={selectedVideo?.nodeId === id}
                  src={data.videoUrl}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (selectedVideo?.nodeId === id && selectedVideo?.startTime) {
                      video.currentTime = selectedVideo.startTime;
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    // Pause video when it reaches the end time of the selected segment
                    if (selectedVideo?.nodeId === id && 
                        selectedVideo?.endTime !== Infinity && 
                        video.currentTime >= selectedVideo.endTime) {
                      video.pause();
                      video.currentTime = selectedVideo.startTime; // Reset to start of segment
                    }
                  }}
                />
              ) : (
                <div className="p-4 flex flex-col items-center justify-center h-full">
                  <Video className="h-8 w-8 mb-2" />
                  <span className="font-bold text-sm text-center">{data.filename}</span>
                  <div className="text-xs opacity-90 mt-1">
                    {data.totalResults} clips
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    No video URL available
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      } else {
        return (
          <div className="relative group">
            {/* Subtle glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg opacity-0 group-hover:opacity-50 blur transition duration-200" />
            
            <div className="relative bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg border border-gray-400 shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transition-all cursor-pointer overflow-hidden" style={{ width: 180, height: 120 }}>
              <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#6b7280', width: 10, height: 10 }}
              />
              
              {/* Thumbnail image as background */}
              {data.thumbnailUrl && (
                <img 
                  src={data.thumbnailUrl} 
                  alt="Moment thumbnail"
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              
              {/* Content overlay */}
              <div className="relative h-full flex flex-col justify-between p-2 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900/80">
                {/* Top section with time */}
                <div className="flex items-center gap-1.5 bg-gray-900/70 rounded px-2 py-1 backdrop-blur-sm">
                  <Play className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {formatTime(data.start)} - {formatTime(data.end)}
                  </span>
                </div>
                
                {/* Bottom section with score */}
                <div className="flex items-center gap-1.5 bg-gray-900/70 rounded px-2 py-1 backdrop-blur-sm">
                  <Star className="h-3 w-3 text-yellow-300 flex-shrink-0" />
                  <span className="text-xs font-semibold">{data.score.toFixed(0)}% match</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  }), [selectedVideo, formatTime]);

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
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultViewport={{ x: -200, y: 0, zoom: 0.6 }}
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