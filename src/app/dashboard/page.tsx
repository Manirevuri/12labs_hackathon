'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Clock, 
  Search, 
  Film, 
  Upload, 
  Play,
  Trash2,
  MoreVertical,
  Calendar,
  Database
} from 'lucide-react';
import { useTwelveLabs } from '@/lib/hooks/useTwelveLabs';
import { IndexSelector } from '@/components/IndexSelector';
import Link from 'next/link';

interface Video {
  id: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  hlsStatus?: string;
}

interface DashboardStats {
  totalVideos: number;
  totalDuration: number;
  averageDuration: number;
  recentUploads: number;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalDuration: 0,
    averageDuration: 0,
    recentUploads: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'duration' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { loading, error, listVideos } = useTwelveLabs();

  useEffect(() => {
    if (selectedIndex) {
      loadVideos();
    }
  }, [selectedIndex]);

  const loadVideos = async () => {
    if (!selectedIndex) return;
    
    try {
      console.log('Loading videos for index:', selectedIndex);
      const videoData = await listVideos(selectedIndex);
      console.log('Received video data:', videoData);
      const videoList = videoData.videos || [];
      console.log('Video list:', videoList);
      console.log('Video list length:', videoList.length);
      setVideos(videoList);
      calculateStats(videoList);
    } catch (err) {
      console.error('Failed to load videos:', err);
    }
  };

  const calculateStats = (videoList: Video[]) => {
    const totalVideos = videoList.length;
    const totalDuration = videoList.reduce((sum, video) => sum + (video.duration || 0), 0);
    const averageDuration = totalVideos > 0 ? totalDuration / totalVideos : 0;
    
    // Calculate recent uploads (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUploads = videoList.filter(video => 
      new Date(video.createdAt) > weekAgo
    ).length;

    setStats({
      totalVideos,
      totalDuration,
      averageDuration,
      recentUploads
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredVideos = videos.filter(video =>
    video.filename?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.filename || '';
        bValue = b.filename || '';
        break;
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'duration':
        aValue = a.duration || 0;
        bValue = b.duration || 0;
        break;
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const statCards = [
    {
      title: 'Total Videos',
      value: stats.totalVideos.toString(),
      icon: Video,
      color: 'from-gray-700 to-gray-800'
    },
    {
      title: 'Total Duration',
      value: formatDuration(stats.totalDuration),
      icon: Clock,
      color: 'from-gray-700 to-gray-800'
    },
    {
      title: 'Average Duration',
      value: formatDuration(stats.averageDuration),
      icon: Play,
      color: 'from-gray-700 to-gray-800'
    },
    {
      title: 'Recent Uploads',
      value: stats.recentUploads.toString(),
      icon: Upload,
      color: 'from-gray-700 to-gray-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-gray-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Video Dashboard
              </h1>
              <p className="text-gray-300">
                Manage and monitor your video library
              </p>
            </div>
          </div>
        </div>

        {/* Index Selection */}
        <div className="mb-8">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Index *
            </label>
            <IndexSelector
              selectedIndex={selectedIndex}
              onIndexSelect={setSelectedIndex}
              className="w-full"
              placeholder="Choose an index to view videos..."
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="text-gray-400">
                Select an index to view its videos and statistics
              </p>
              <Link
                href="/indexes"
                className="text-gray-400 hover:text-white transition-colors font-medium flex items-center gap-1"
              >
                <Database className="h-3 w-3 text-gray-500" />
                Manage Indexes
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {selectedIndex && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                  <stat.icon className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {selectedIndex && (
          <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 transition-all"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-lg text-gray-300 text-sm focus:border-gray-400 focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="duration">Sort by Duration</option>
              <option value="size">Sort by Size</option>
            </select>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-lg text-gray-300 text-sm hover:bg-gray-900/80 transition-all"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        )}

        {/* Videos Table */}
        {!selectedIndex ? (
          <div className="text-center py-12">
            <Database className="h-8 w-8 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Select an Index
            </h3>
            <p className="text-gray-400 mb-4">
              Choose an index from the dropdown above to view its videos and statistics.
            </p>
            <Link
              href="/indexes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
            >
              <Database className="h-4 w-4 text-gray-500" />
              Manage Indexes
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading videos...</p>
          </div>
        ) : sortedVideos.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-gray-800/60 backdrop-blur-xl border border-gray-700/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                      Video
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                      Duration
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                      Resolution
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                      Size
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                      Uploaded
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {sortedVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-800/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded overflow-hidden">
                            {video.thumbnailUrl ? (
                              <>
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.filename || 'Video thumbnail'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to placeholder if thumbnail fails to load
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden w-full h-full flex items-center justify-center">
                                  <Play className="h-3 w-3 text-gray-500" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-3 w-3 text-gray-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="h-3 w-3 text-gray-500" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-white truncate max-w-xs">
                              {video.filename || 'Unnamed Video'}
                            </p>
                            <p className="text-xs text-gray-400">
                              ID: {video.id?.slice(0, 8) || 'N/A'}...
                            </p>
                            {video.hlsStatus && (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mt-1 ${
                                video.hlsStatus === 'COMPLETE' 
                                  ? 'bg-green-900/20 text-green-400'
                                  : 'bg-yellow-900/20 text-yellow-400'
                              }`}>
                                {video.hlsStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDuration(video.duration || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {video.width && video.height ? `${video.width}×${video.height}` : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatFileSize(video.size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          {formatDate(video.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
                            <Search className="h-3 w-3 text-gray-500" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
                            <Film className="h-3 w-3 text-gray-500" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Video className="h-8 w-8 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No videos found
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'No videos match your search.' : 'Upload some videos to get started.'}
            </p>
            {!searchTerm && (
              <Link 
                href="/upload"
                className="inline-block px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
              >
                Upload Videos
              </Link>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}