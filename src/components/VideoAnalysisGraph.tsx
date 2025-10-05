'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Network } from 'lucide-react';
import { VideoMemoryGraph } from './graph';

interface AnalysisData {
  analysisText: string;
  timestamp: string;
  videoId: string;
  modelUsed: string;
  promptType: string;
  enhancedWithGPT?: boolean;
  extractedElements: {
    topics?: string[];
    entities?: Array<{
      name: string;
      type: 'person' | 'place' | 'object' | 'concept' | 'brand';
      confidence: number;
      description?: string;
    }>;
    relationships?: Array<{
      from: string;
      to: string;
      type: 'mentions' | 'relates_to' | 'occurs_with' | 'uses' | 'shows';
      strength: number;
    }>;
    keyMoments?: Array<{
      timestamp: string;
      description: string;
      importance: number;
    }>;
    brands?: Array<{
      name: string;
      prominence: number;
      context: string;
    }>;
    sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
    summary?: string;
    // Fallback for old format
    scenes?: string[];
  };
}

interface VideoAnalysisGraphProps {
  videoId: string;
  indexId: string;
}

export default function VideoAnalysisGraph({ videoId, indexId }: VideoAnalysisGraphProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMemoryGraph, setShowMemoryGraph] = useState(false);

  const analyzeVideo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/videos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, indexId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      {/* Analyze button - only shown when no analysis exists */}
      {!analysis && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={analyzeVideo}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            <Brain className="h-4 w-4" />
            {loading ? 'Analyzing...' : 'Analyze Video'}
          </button>
        </div>
      )}

      {!analysis ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium mb-2">Ready for Analysis</p>
            <p className="text-sm">Click "Analyze Video" to start processing with Pegasus</p>
          </div>
        </div>
      ) : (
        <>
          {/* Compact Header with Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Tab Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMemoryGraph(false)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    !showMemoryGraph
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Brain className="h-3.5 w-3.5" />
                  Summary
                </button>
                <button
                  onClick={() => setShowMemoryGraph(true)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    showMemoryGraph
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Network className="h-3.5 w-3.5" />
                  Memory Graph
                </button>
              </div>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(analysis.analysisText);
                  alert('Analysis copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Content based on view mode */}
          {showMemoryGraph ? (
            <VideoMemoryGraph
              videoId={videoId}
              indexId={indexId}
              className="w-full h-full"
              onSentenceClick={(memory) => {
                console.log('Sentence clicked:', memory.sentence);
              }}
            />
          ) : (
            <div className="flex-1 bg-gray-800 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">

                <div className="bg-gray-900 rounded-lg p-6 space-y-6">
                  {/* Full Analysis Text */}
                  <div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 border-b border-gray-600 pb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-3 mt-4">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-medium text-gray-200 mb-2 mt-3">{children}</h3>,
                          p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-300 ml-2">{children}</li>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-gray-200 italic">{children}</em>,
                          code: ({ children }) => <code className="bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-400 my-3">{children}</blockquote>
                        }}
                      >
                        {analysis.analysisText}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Quick Summary */}
                  {analysis.extractedElements.summary && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                      <p className="text-gray-300 leading-relaxed">{analysis.extractedElements.summary}</p>
                    </div>
                  )}

                  {/* Sentiment */}
                  {analysis.extractedElements.sentiment && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Sentiment</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        analysis.extractedElements.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        analysis.extractedElements.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        analysis.extractedElements.sentiment === 'mixed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {analysis.extractedElements.sentiment.charAt(0).toUpperCase() + analysis.extractedElements.sentiment.slice(1)}
                      </span>
                    </div>
                  )}




                  {/* Analysis Info */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Model:</span> {analysis.modelUsed}
                        {analysis.enhancedWithGPT && <span className="text-purple-400 ml-1">+ GPT-4o-mini</span>}
                        {analysis.modelUsed?.includes('fallback') && <span className="text-orange-400 ml-1">(Simplified)</span>}
                      </div>
                      <div>
                        <span className="font-medium">Analysis Time:</span> {new Date(analysis.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {error && (
        <div className="absolute top-2 left-2 bg-red-900 text-red-200 p-3 rounded-lg shadow-lg">
          Error: {error}
        </div>
      )}
    </div>
  );
}