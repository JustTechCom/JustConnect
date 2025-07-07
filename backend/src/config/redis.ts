import Redis from 'ioredis';

let redis: Redis;

export const initializeRedis = () => {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      console.log('🔴 Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
  }
};

export { redis };
