'use client';

import { useState, useCallback } from 'react';

export interface Index {
  id: string;
  indexName: string;
  createdAt: string;
  updatedAt: string;
  videoCount?: number;
  models: Array<{
    modelName: string;
    modelOptions: string[];
  }>;
}

export function useIndexes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listIndexes = useCallback(async (): Promise<Index[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/indexes');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.indexes || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list indexes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createIndex = useCallback(async (indexName: string, models: Array<{ modelName: string; modelOptions: string[] }>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/indexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indexName, models }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.index;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create index');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteIndex = useCallback(async (indexId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/indexes/${indexId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete index');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getIndex = useCallback(async (indexId: string): Promise<Index> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/indexes/${indexId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.index;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get index');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listIndexes,
    createIndex,
    deleteIndex,
    getIndex,
  };
}