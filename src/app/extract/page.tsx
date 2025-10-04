'use client';

import { useState, useEffect } from 'react';
import { Film, Download, Filter, Play, Clock, Star, Settings } from 'lucide-react';
import { useTwelveLabs } from '@/lib/hooks/useTwelveLabs';

interface ExtractedMoment {
  id: string;
  videoId: string;
  filename: string;
  start: number;
  end: number;
  duration: number;
  score: number;
  thumbnailUrl?: string;
}

interface Video {
  id: string;
  filename: string;
  duration: number;
}

export default function ExtractPage() {
  const [selectedMomentType, setSelectedMomentType] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [extractedMoments, setExtractedMoments] = useState<ExtractedMoment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0.7);
  const [groupedMoments, setGroupedMoments] = useState<Record<string, ExtractedMoment[]>>({});
  const [useCustomQuery, setUseCustomQuery] = useState(false);

  const { loading, error, extractMoments, listVideos } = useTwelveLabs();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const videoData = await listVideos();
      setVideos(videoData.videos || []);
    } catch (err) {
      console.error('Failed to load videos:', err);
    }
  };

  const momentTypes = {
    'emotional': {
      name: 'Emotional Moments',
      description: 'Scenes with emotional content, tears, joy, reunions',
      icon: '😢'
    },
    'action': {
      name: 'Action Scenes',
      description: 'Movement, sports, fighting, dynamic sequences',
      icon: '⚡'
    },
    'dialogue': {
      name: 'Dialogue & Speech',
      description: 'Conversations, interviews, presentations',
      icon: '💬'
    },
    'brand': {
      name: 'Brand Moments',
      description: 'Logo appearances, product placements, marketing',
      icon: '🏷️'
    },
    'music': {
      name: 'Music & Performance',
      description: 'Musical performances, singing, dancing',
      icon: '🎵'
    },
    'landscape': {
      name: 'Landscape & Nature',
      description: 'Outdoor scenes, beautiful scenery, nature shots',
      icon: '🌿'
    }
  };

  const handleExtract = async () => {
    const query = useCustomQuery ? customQuery : selectedMomentType;
    if (!query) return;

    try {
      const results = await extractMoments(
        useCustomQuery ? undefined : selectedMomentType,
        useCustomQuery ? customQuery : undefined,
        selectedVideos.length > 0 ? selectedVideos : undefined,
        confidence
      );
      
      setExtractedMoments(results.moments);
      setGroupedMoments(results.groupedByVideo);
    } catch (err) {
      console.error('Extraction failed:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const exportMoments = () => {
    const data = extractedMoments.map(moment => ({
      filename: moment.filename,
      start_time: moment.start,
      end_time: moment.end,
      duration: moment.duration,
      confidence_score: moment.score
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_moments_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <Film className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Extract Moments
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Automatically identify and extract specific types of moments from your video collection. 
            Get clips of emotions, actions, dialogue, and more across multiple videos.
          </p>
        </div>

        {/* Extraction Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </h2>

              {/* Query Type Toggle */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useCustomQuery}
                    onChange={() => setUseCustomQuery(false)}
                    className="text-gray-700"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Predefined moment types</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useCustomQuery}
                    onChange={() => setUseCustomQuery(true)}
                    className="text-gray-700"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Custom query</span>
                </label>
              </div>

              {/* Moment Type Selection */}
              {!useCustomQuery ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Moment Type
                  </label>
                  <div className="space-y-2">
                    {Object.entries(momentTypes).map(([key, type]) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                        <input
                          type="radio"
                          value={key}
                          checked={selectedMomentType === key}
                          onChange={(e) => setSelectedMomentType(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{type.icon}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {type.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Query
                  </label>
                  <textarea
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Describe the type of moments you want to extract..."
                    className="w-full h-24 px-3 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all resize-none"
                  />
                </div>
              )}

              {/* Video Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Videos (optional)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {videos.map((video) => (
                    <label key={video.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(video.id)}
                        onChange={() => handleVideoSelection(video.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {video.filename}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to search all videos
                </p>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confidence Threshold: {(confidence * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Higher values return fewer but more accurate results
                </p>
              </div>

              {/* Extract Button */}
              <button
                onClick={handleExtract}
                disabled={loading || (!selectedMomentType && !customQuery.trim())}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Extracting...' : 'Extract Moments'}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {extractedMoments.length > 0 && (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Extracted {extractedMoments.length} moments
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From {Object.keys(groupedMoments).length} videos
                    </p>
                  </div>
                  <button
                    onClick={exportMoments}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>

                {/* Moments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedMoments
                    .sort((a, b) => b.score - a.score)
                    .map((moment, idx) => (
                    <div
                      key={moment.id}
                      className="relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all group"
                    >
                      {/* Thumbnail Placeholder */}
                      <div className="relative h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <Play className="h-8 w-8 text-gray-500 group-hover:text-gray-700 transition-colors" />
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {formatTime(moment.duration)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                          {moment.filename}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(moment.start)} - {formatTime(moment.end)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {(moment.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          
                          <button className="px-3 py-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg text-sm hover:from-gray-800 hover:to-black transition-all">
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {extractedMoments.length === 0 && !loading && (
              <div className="text-center py-12">
                <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No moments extracted yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a moment type or enter a custom query to get started.
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}