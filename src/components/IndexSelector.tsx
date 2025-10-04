'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Database, CheckCircle } from 'lucide-react';
import { useIndexes, type Index } from '@/lib/hooks/useIndexes';

interface IndexSelectorProps {
  selectedIndex: string | null;
  onIndexSelect: (indexId: string) => void;
  className?: string;
  placeholder?: string;
}

export function IndexSelector({ 
  selectedIndex, 
  onIndexSelect, 
  className = '',
  placeholder = 'Select an index...'
}: IndexSelectorProps) {
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { listIndexes, loading } = useIndexes();

  useEffect(() => {
    loadIndexes();
  }, []);

  const loadIndexes = async () => {
    try {
      const indexList = await listIndexes();
      setIndexes(indexList);
      
      // Auto-select first index if none selected
      if (!selectedIndex && indexList.length > 0) {
        onIndexSelect(indexList[0].id);
      }
    } catch (err) {
      console.error('Failed to load indexes:', err);
    }
  };

  const selectedIndexData = indexes.find(index => index.id === selectedIndex);

  const getModelBadgeColor = (modelName: string) => {
    if (modelName.includes('marengo')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    if (modelName.includes('pegasus')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  if (loading && indexes.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
          Loading indexes...
        </div>
      </div>
    );
  }

  if (indexes.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
          No indexes available. Create one first.
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-left flex items-center justify-between hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Database className="h-4 w-4 text-gray-500 flex-shrink-0" />
          {selectedIndexData ? (
            <div className="min-w-0 flex-1">
              <span className="font-medium text-gray-900 dark:text-white truncate block">
                {selectedIndexData.indexName}
              </span>
              <div className="flex gap-1 mt-1">
                {selectedIndexData.models.map((model, idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${getModelBadgeColor(model.modelName)}`}
                  >
                    {model.modelName.split('.')[0]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 truncate">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {indexes.map((index) => (
            <button
              key={index.id}
              onClick={() => {
                onIndexSelect(index.id);
                setIsOpen(false);
              }}
              className="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {index.indexName}
                    </span>
                    {selectedIndex === index.id && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {index.models.map((model, idx) => (
                        <span
                          key={idx}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${getModelBadgeColor(model.modelName)}`}
                        >
                          {model.modelName.split('.')[0]}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {index.videoCount || 0} videos
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}