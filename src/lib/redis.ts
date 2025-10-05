import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is not set');
}

// Create a Redis client
const redisClient = createClient({
  url: redisUrl
});

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect to Redis
if (!redisClient.isOpen) {
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
}

export { redisClient };

// Helper functions for video URL storage
export async function storeVideoUrl(videoId: string, videoUrl: string) {
  try {
    // Store with expiration of 30 days
    await redisClient.setEx(`video:${videoId}`, 30 * 24 * 60 * 60, videoUrl);
    console.log(`Stored video URL for ID: ${videoId}`);
    return true;
  } catch (error) {
    console.error('Error storing video URL:', error);
    return false;
  }
}

export async function getVideoUrl(videoId: string): Promise<string | null> {
  try {
    const url = await redisClient.get(`video:${videoId}`);
    return url;
  } catch (error) {
    console.error('Error getting video URL:', error);
    return null;
  }
}

export async function storeTaskMapping(taskId: string, videoUrl: string) {
  try {
    // Store with expiration of 1 day for task mappings
    await redisClient.setEx(`task:${taskId}`, 24 * 60 * 60, videoUrl);
    console.log(`Stored task mapping for ID: ${taskId}`);
    return true;
  } catch (error) {
    console.error('Error storing task mapping:', error);
    return false;
  }
}

export async function getTaskMapping(taskId: string): Promise<string | null> {
  try {
    const url = await redisClient.get(`task:${taskId}`);
    return url;
  } catch (error) {
    console.error('Error getting task mapping:', error);
    return null;
  }
}

// User-Index mapping functions
export async function addUserIndex(userId: string, indexId: string) {
  try {
    // Store index in user's set of indexes
    await redisClient.sAdd(`user:${userId}:indexes`, indexId);
    // Store user ID for the index (for reverse lookup)
    await redisClient.set(`index:${indexId}:owner`, userId);
    console.log(`Added index ${indexId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error adding user index:', error);
    return false;
  }
}

export async function getUserIndexes(userId: string): Promise<string[]> {
  try {
    const indexes = await redisClient.sMembers(`user:${userId}:indexes`);
    return indexes || [];
  } catch (error) {
    console.error('Error getting user indexes:', error);
    return [];
  }
}

export async function isUserIndexOwner(userId: string, indexId: string): Promise<boolean> {
  try {
    const owner = await redisClient.get(`index:${indexId}:owner`);
    return owner === userId;
  } catch (error) {
    console.error('Error checking index ownership:', error);
    return false;
  }
}

export async function removeUserIndex(userId: string, indexId: string) {
  try {
    await redisClient.sRem(`user:${userId}:indexes`, indexId);
    await redisClient.del(`index:${indexId}:owner`);
    console.log(`Removed index ${indexId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error removing user index:', error);
    return false;
  }
}