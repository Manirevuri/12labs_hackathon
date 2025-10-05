'use client';

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, Clock, FileVideo, Database } from 'lucide-react';
import { useTwelveLabs } from '@/lib/hooks/useTwelveLabs';
import { IndexSelector } from '@/components/IndexSelector';
import Link from 'next/link';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<Array<{
    id: string;
    filename: string;
    status: string;
    progress?: number;
    videoId?: string;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { 
    loading, 
    error, 
    uploadVideo, 
    checkTaskStatus 
  } = useTwelveLabs();

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setSelectedFile(file);
    } else {
      alert('Please select a video file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !selectedIndex) return;

    try {
      const task = await uploadVideo(selectedFile, undefined, selectedIndex);
      const newTask = {
        id: task.taskId,
        filename: selectedFile.name,
        status: task.status,
        progress: 0,
      };
      
      setUploadTasks(prev => [newTask, ...prev]);
      setSelectedFile(null);

      // Poll for status updates
      const pollStatus = async () => {
        try {
          const updatedTask = await checkTaskStatus(task.taskId);
          setUploadTasks(prev => 
            prev.map(t => 
              t.id === task.taskId 
                ? { ...t, status: updatedTask.status, progress: updatedTask.progress, videoId: updatedTask.videoId }
                : t
            )
          );

          if (updatedTask.status === 'processing') {
            setTimeout(pollStatus, 3000);
          }
        } catch (err) {
          console.error('Failed to check status:', err);
        }
      };

      setTimeout(pollStatus, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-400 bg-green-900/20';
      case 'failed': return 'text-red-400 bg-red-900/20';
      default: return 'text-yellow-400 bg-yellow-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <Upload className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Upload Videos
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Upload your videos to start indexing them with AI. Once processed, you can search for any moment or extract specific scenes.
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
              placeholder="Choose an index for your videos..."
            />
            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="text-gray-400">
                Videos will be uploaded to the selected index
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

        {/* Upload Area */}
        <div className="mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
              isDragging
                ? 'border-gray-500 bg-gray-800/50'
                : 'border-gray-700'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl" />
            <div className="relative p-12 text-center">
              <div className="flex justify-center mb-4">
                <FileVideo className="h-12 w-12 text-gray-400" />
              </div>
              
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="font-medium text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={loading || !selectedIndex}
                      className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Upload Video'}
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xl font-medium text-white">
                    Drop your video here or click to browse
                  </p>
                  <p className="text-gray-400">
                    Supports MP4, MOV, AVI and other video formats
                  </p>
                  
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    Choose Video File
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadTasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Upload History
            </h2>
            
            <div className="space-y-3">
              {uploadTasks.map((task) => (
                <div
                  key={task.id}
                  className="relative overflow-hidden rounded-xl bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <p className="font-medium text-white">
                          {task.filename}
                        </p>
                        <p className="text-sm text-gray-400">
                          Task ID: {task.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.progress && (
                        <p className="text-xs text-gray-500 mt-1">
                          {task.progress}% complete
                        </p>
                      )}
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
      </div>
    </div>
  );
}