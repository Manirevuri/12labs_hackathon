import { TwelveLabs } from 'twelvelabs-js';

if (!process.env.TWELVELABS_API_KEY) {
  throw new Error('TWELVELABS_API_KEY environment variable is not set');
}

export const twelveLabsClient = new TwelveLabs({
  apiKey: process.env.TWELVELABS_API_KEY,
});


export interface VideoSearchResult {
  id: string;
  score: number;
  start: number;
  end: number;
  metadata: {
    video_id: string;
    duration: number;
    width: number;
    height: number;
    filename: string;
  };
  thumbnailUrl?: string;
}

export interface VideoUploadTask {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  progress?: number;
  video_id?: string;
}

export interface IndexInfo {
  id: string;
  name: string;
  created_at: string;
  models: Array<{
    name: string;
    options: string[];
  }>;
}