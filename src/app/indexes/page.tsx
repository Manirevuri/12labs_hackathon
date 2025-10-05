'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Settings, 
  Trash2, 
  Eye, 
  Calendar,
  Video,
  CheckCircle,
  AlertCircle,
  Info,
  Brain,
  Search as SearchIcon,
  Volume2,
  Eye as EyeIcon
} from 'lucide-react';

interface Index {
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

interface IndexCreationForm {
  name: string;
  models: {
    marengo: {
      enabled: boolean;
      modalities: string[];
    };
    pegasus: {
      enabled: boolean;
      modalities: string[];
    };
  };
}

export default function IndexesPage() {
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<IndexCreationForm>({
    name: '',
    models: {
      marengo: {
        enabled: true,
        modalities: ['visual', 'audio']
      },
      pegasus: {
        enabled: false,
        modalities: ['visual', 'audio']
      }
    }
  });

  useEffect(() => {
    loadIndexes();
  }, []);

  const loadIndexes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/indexes');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIndexes(data.indexes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load indexes');
    } finally {
      setLoading(false);
    }
  };

  const createIndex = async () => {
    if (!formData.name.trim()) {
      setError('Index name is required');
      return;
    }

    if (!formData.models.marengo.enabled && !formData.models.pegasus.enabled) {
      setError('At least one model must be enabled');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const models = [];
      
      if (formData.models.marengo.enabled) {
        models.push({
          modelName: 'marengo2.7',
          modelOptions: formData.models.marengo.modalities
        });
      }
      
      if (formData.models.pegasus.enabled) {
        models.push({
          modelName: 'pegasus1.2',
          modelOptions: formData.models.pegasus.modalities
        });
      }

      const response = await fetch('/api/indexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indexName: formData.name,
          models
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setShowCreateModal(false);
      setFormData({
        name: '',
        models: {
          marengo: { enabled: true, modalities: ['visual', 'audio'] },
          pegasus: { enabled: false, modalities: ['visual', 'audio'] }
        }
      });
      loadIndexes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create index');
    } finally {
      setLoading(false);
    }
  };

  const deleteIndex = async (indexId: string, indexName: string) => {
    if (!confirm(`Are you sure you want to delete "${indexName}"? This action cannot be undone and will delete all videos in this index.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/indexes/${indexId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      
      loadIndexes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete index');
    }
  };

  const toggleModel = (model: 'marengo' | 'pegasus') => {
    setFormData(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [model]: {
          ...prev.models[model],
          enabled: !prev.models[model].enabled
        }
      }
    }));
  };

  const toggleModality = (model: 'marengo' | 'pegasus', modality: string) => {
    setFormData(prev => {
      const currentModalities = prev.models[model].modalities;
      const newModalities = currentModalities.includes(modality)
        ? currentModalities.filter(m => m !== modality)
        : [...currentModalities, modality];
      
      return {
        ...prev,
        models: {
          ...prev.models,
          [model]: {
            ...prev.models[model],
            modalities: newModalities
          }
        }
      };
    });
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

  const getModelBadgeColor = (modelName: string) => {
    if (modelName.includes('marengo')) return 'bg-blue-900/20 text-blue-400';
    if (modelName.includes('pegasus')) return 'bg-purple-900/20 text-purple-400';
    return 'bg-gray-900/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Index Management
              </h1>
              <p className="text-gray-300">
                Create and manage your video indexes
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Create Index
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">About Indexes</p>
              <p>
                Indexes store and organize your video data, allowing you to group related videos. 
                Choose models based on your needs: <strong>Marengo</strong> for searching videos, 
                <strong>Pegasus</strong> for generating text and analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Indexes List */}
        {loading && indexes.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading indexes...</p>
          </div>
        ) : indexes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indexes.map((index) => (
              <div
                key={index.id}
                className="relative overflow-hidden rounded-2xl bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg truncate">
                      {index.indexName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      ID: {index.id.slice(0, 8)}...
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteIndex(index.id, index.indexName)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete index"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Models */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Models:</p>
                  <div className="flex flex-wrap gap-2">
                    {index.models.map((model, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${getModelBadgeColor(model.modelName)}`}
                      >
                        {model.modelName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modalities */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Modalities:</p>
                  <div className="flex gap-2">
                    {index.models[0]?.modelOptions.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-gray-400">
                        {option === 'visual' ? (
                          <EyeIcon className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>{index.videoCount || 0} videos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(index.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No indexes found
            </h3>
            <p className="text-gray-400 mb-4">
              Create your first index to start organizing your videos.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-medium hover:from-gray-800 hover:to-black transition-all shadow-lg hover:shadow-xl"
            >
              Create Index
            </button>
          </div>
        )}

        {/* Create Index Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Create New Index
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                {/* Index Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Index Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Marketing Videos 2024"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:border-gray-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Choose a descriptive name to help organize your videos
                  </p>
                </div>

                {/* Model Selection */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">
                    Model Configuration
                  </h3>

                  {/* Marengo */}
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    formData.models.marengo.enabled 
                      ? 'border-blue-700 bg-blue-900/20' 
                      : 'border-gray-700'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.models.marengo.enabled}
                        onChange={() => toggleModel('marengo')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <SearchIcon className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-white">
                            Marengo 2.7 (Embedding Model)
                          </h4>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          For video search and similarity matching. Analyzes content to create embeddings for finding specific moments.
                        </p>
                        
                        {formData.models.marengo.enabled && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-300">
                              Modalities:
                            </p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.models.marengo.modalities.includes('visual')}
                                  onChange={() => toggleModality('marengo', 'visual')}
                                />
                                <EyeIcon className="h-4 w-4" />
                                <span className="text-sm">Visual</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.models.marengo.modalities.includes('audio')}
                                  onChange={() => toggleModality('marengo', 'audio')}
                                />
                                <Volume2 className="h-4 w-4" />
                                <span className="text-sm">Audio</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pegasus */}
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    formData.models.pegasus.enabled 
                      ? 'border-purple-700 bg-purple-900/20' 
                      : 'border-gray-700'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.models.pegasus.enabled}
                        onChange={() => toggleModel('pegasus')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-white">
                            Pegasus 1.2 (Generative Model)
                          </h4>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          For video analysis and text generation. Creates summaries, answers questions, and generates insights about video content.
                        </p>
                        
                        {formData.models.pegasus.enabled && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-300">
                              Modalities:
                            </p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.models.pegasus.modalities.includes('visual')}
                                  onChange={() => toggleModality('pegasus', 'visual')}
                                />
                                <EyeIcon className="h-4 w-4" />
                                <span className="text-sm">Visual</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.models.pegasus.modalities.includes('audio')}
                                  onChange={() => toggleModality('pegasus', 'audio')}
                                />
                                <Volume2 className="h-4 w-4" />
                                <span className="text-sm">Audio</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Preview */}
                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Configuration Preview:</h4>
                  <div className="text-sm text-gray-400">
                    <p><strong>Index:</strong> {formData.name || 'Unnamed Index'}</p>
                    <p><strong>Models:</strong> {
                      [
                        formData.models.marengo.enabled && 'Marengo 2.7',
                        formData.models.pegasus.enabled && 'Pegasus 1.2'
                      ].filter(Boolean).join(', ') || 'None selected'
                    }</p>
                    <p><strong>Capabilities:</strong> {
                      [
                        formData.models.marengo.enabled && 'Video Search',
                        formData.models.pegasus.enabled && 'Text Generation'
                      ].filter(Boolean).join(', ') || 'None'
                    }</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createIndex}
                    disabled={loading || !formData.name.trim() || (!formData.models.marengo.enabled && !formData.models.pegasus.enabled)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:from-gray-800 hover:to-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Index'}
                  </button>
                </div>
              </div>
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