'use client';

/**
 * Client-side thumbnail generator using HTML5 Canvas
 * This extracts frames from videos at specific timestamps
 */

/**
 * Extract a frame from a video at a specific timestamp
 * @param videoUrl - URL of the video
 * @param timestamp - Time in seconds to extract the frame
 * @returns Promise<Blob> - The extracted frame as a Blob
 */
export async function extractFrameFromVideo(
  videoUrl: string,
  timestamp: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      resolve(null);
      return;
    }

    // Set up video element
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    // Handle video loaded metadata
    video.addEventListener('loadedmetadata', () => {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to the specified timestamp
      video.currentTime = timestamp;
    });

    // Handle seeked event (when video has moved to timestamp)
    video.addEventListener('seeked', () => {
      // Draw the current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.8
      );
    });

    // Handle errors
    video.addEventListener('error', (error) => {
      console.error('Video loading error:', error);
      resolve(null);
    });

    // Start loading the video
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Upload a thumbnail to the server
 * @param blob - The thumbnail blob
 * @param videoId - The video ID
 * @param timestamp - The timestamp of the frame
 * @returns Promise<string> - The URL of the uploaded thumbnail
 */
export async function uploadThumbnail(
  blob: Blob,
  videoId: string,
  timestamp: number
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('thumbnail', blob, `thumbnail_${videoId}_${Math.floor(timestamp)}.jpg`);
    formData.append('videoId', videoId);
    formData.append('timestamp', timestamp.toString());

    const response = await fetch('/api/videos/thumbnail/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload thumbnail');
    }

    const data = await response.json();
    return data.thumbnailUrl;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }
}

/**
 * Generate and upload a thumbnail for a video segment
 * @param videoUrl - URL of the video
 * @param videoId - The video ID
 * @param timestamp - The timestamp to extract
 * @returns Promise<string> - The URL of the generated thumbnail
 */
export async function generateAndUploadThumbnail(
  videoUrl: string,
  videoId: string,
  timestamp: number
): Promise<string | null> {
  try {
    // First check if thumbnail already exists
    const checkResponse = await fetch(
      `/api/videos/thumbnail?videoId=${videoId}&timestamp=${Math.floor(timestamp)}`
    );
    
    if (checkResponse.ok) {
      const data = await checkResponse.json();
      if (data.exists && data.thumbnailUrl) {
        return data.thumbnailUrl;
      }
    }

    // Extract frame from video
    const blob = await extractFrameFromVideo(videoUrl, timestamp);
    
    if (!blob) {
      console.error('Failed to extract frame from video');
      return null;
    }

    // Upload the thumbnail
    const thumbnailUrl = await uploadThumbnail(blob, videoId, timestamp);
    
    return thumbnailUrl;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Batch generate thumbnails for multiple segments
 * @param videoUrl - URL of the video
 * @param videoId - The video ID
 * @param timestamps - Array of timestamps to extract
 * @returns Promise<Map<number, string>> - Map of timestamp to thumbnail URL
 */
export async function batchGenerateThumbnails(
  videoUrl: string,
  videoId: string,
  timestamps: number[]
): Promise<Map<number, string>> {
  const thumbnailMap = new Map<number, string>();
  
  // Process thumbnails in parallel with a limit
  const batchSize = 3; // Process 3 at a time to avoid overwhelming the browser
  
  for (let i = 0; i < timestamps.length; i += batchSize) {
    const batch = timestamps.slice(i, i + batchSize);
    const promises = batch.map(async (timestamp) => {
      const url = await generateAndUploadThumbnail(videoUrl, videoId, timestamp);
      if (url) {
        thumbnailMap.set(timestamp, url);
      }
    });
    
    await Promise.all(promises);
  }
  
  return thumbnailMap;
}