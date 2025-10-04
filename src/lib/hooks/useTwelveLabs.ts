'use client';

import { useState, useCallback } from 'react';

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

interface UploadTask {
  taskId: string;
  status: string;
  progress?: number;
  videoId?: string;
}


export function useTwelveLabs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/indexes', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create index');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVideos = useCallback(async (query: string, searchOptions = ['visual', 'audio'], indexId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/videos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, searchOptions, indexId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data as { results: SearchResult[]; query: string; totalResults: number };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search videos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (file: File, fileName?: string, indexId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('video', file);
      if (fileName) formData.append('fileName', fileName);
      if (indexId) formData.append('indexId', indexId);

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data as UploadTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkTaskStatus = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/videos/upload?taskId=${taskId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data as UploadTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check task status');
      throw err;
    }
  }, []);


  const listVideos = useCallback(async (indexId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = indexId ? `/api/videos/list?indexId=${indexId}` : '/api/videos/list';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list videos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createIndex,
    searchVideos,
    uploadVideo,
    checkTaskStatus,
    listVideos,
  };
}