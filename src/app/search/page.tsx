'use client';

import { useState } from 'react';
import { Search, Play, Clock, Star, Filter, Database } from 'lucide-react';
import { useTwelveLabs } from '@/lib/hooks/useTwelveLabs';
import { IndexSelector } from '@/components/IndexSelector';
import Link from 'next/link';

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

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState(['visual', 'audio']);
  const [sortBy, setSortBy] = useState<'relevance' | 'duration'>('relevance');
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  const { loading, error, searchVideos } = useTwelveLabs();

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedIndex) return;

    try {
      const results = await searchVideos(searchQuery, selectedOptions, selectedIndex);
      setSearchResults(results.results);
      
      // Add to search history
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    if (sortBy === 'relevance') {
      return b.score - a.score;
    } else {
      return (b.end - b.start) - (a.end - a.start);
    }
  });

  const exampleQueries = [
    "emotional reunion scene",
    "product close-up shots",
    "people laughing and smiling",
    "action sequences with movement",
    "dialogue between two people",
    "outdoor landscape views",
    "music and dancing",
    "brand logos appearing"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <Search className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Search Video Moments
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Use natural language to find exact moments across your entire video library. 
            Describe what you're looking for and AI will find the matching scenes.
          </p>
        </div>

        {/* Index Selection */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Index *
            </label>
            <IndexSelector
              selectedIndex={selectedIndex}
              onIndexSelect={setSelectedIndex}
              className="w-full"
              placeholder="Choose an index to search..."
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="text-gray-400">
                Search will be performed within the selected index
              </p>
              <Link
                href="/indexes"
                className="text-gray-400 hover:text-white transition-colors font-medium flex items-center gap-1"
              >
                <Database className="h-4 w-4" />
                Manage Indexes
              </Link>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        {selectedIndex && (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-6">
            {/* Search Input */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Describe the moment you're looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
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

            {/* Search Options */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400">Search in:</span>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes('visual')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOptions(prev => [...prev, 'visual']);
                    } else {
                      setSelectedOptions(prev => prev.filter(opt => opt !== 'visual'));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-300">Visual</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes('audio')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOptions(prev => [...prev, 'audio']);
                    } else {
                      setSelectedOptions(prev => prev.filter(opt => opt !== 'audio'));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-300">Audio</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'duration')}
                className="px-3 py-1 bg-gray-900/60 border border-gray-700/50 rounded text-gray-300 text-sm"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="duration">Sort by Duration</option>
              </select>
            </div>
          </div>
          </div>
        )}

        {/* Example Queries */}
        {selectedIndex && searchResults.length === 0 && !loading && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Try these example searches:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(query)}
                  className="text-left p-3 bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-lg hover:bg-gray-800/60 transition-all text-gray-300"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Searches:
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(query)}
                  className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-all"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Found {searchResults.length} moments
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResults.map((result, idx) => (
                <div
                  key={`${result.id}-${idx}`}
                  className="relative overflow-hidden rounded-xl bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 hover:shadow-lg transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center overflow-hidden">
                    {result.thumbnailUrl ? (
                      <img 
                        src={result.thumbnailUrl}
                        alt={result.metadata?.filename || 'Video thumbnail'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${result.thumbnailUrl ? 'hidden' : 'flex'}`}>
                      <Play className="h-12 w-12 text-gray-500 group-hover:text-gray-700 transition-colors" />
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {formatTime(result.end - result.start)}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate">
                      {result.metadata?.filename || 'Unknown Video'}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(result.start)} - {formatTime(result.end)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-300">
                          {result.score.toFixed(1)}%
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

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && searchQuery && !loading && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No moments found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search terms or make sure videos are uploaded and indexed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}