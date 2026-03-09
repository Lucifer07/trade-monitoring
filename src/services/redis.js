const Redis = require('ioredis');
const { config } = require('../config');

class RedisClient {
  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    this.client.on('close', () => {
      console.log('Redis connection closed');
    });
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error.message);
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (ttl) {
        await this.client.setex(key, ttl, strValue);
      } else {
        await this.client.set(key, strValue);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      throw error;
    }
  }

  async hgetall(key) {
    try {
      const result = await this.client.hgetall(key);
      const parsed = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      return parsed;
    } catch (error) {
      console.error('Redis hgetall error:', error.message);
      throw error;
    }
  }

  async hset(key, field, value) {
    try {
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await this.client.hset(key, field, strValue);
      return true;
    } catch (error) {
      console.error('Redis hset error:', error.message);
      throw error;
    }
  }

  async close() {
    await this.client.quit();
    console.log('Redis connection closed');
  }
}

let redisInstance = null;

function getRedis() {
  if (!redisInstance) {
    redisInstance = new RedisClient();
  }
  return redisInstance;
}

module.exports = { RedisClient, getRedis };
