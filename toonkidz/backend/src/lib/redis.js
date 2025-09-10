const redis = require('redis');
const { promisify } = require('util');
const config = require('../config/database.config');

class RedisConnection {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client) return this.client;
    
    try {
      this.client = redis.createClient(config.redis.url);
      
      // Promisify Redis methods
      this.client.get = promisify(this.client.get).bind(this.client);
      this.client.set = promisify(this.client.set).bind(this.client);
      this.client.del = promisify(this.client.del).bind(this.client);
      
      await this.client.connect();
      console.log('Redis connected successfully');
      return this.client;
    } catch (error) {
      console.error('Redis connection error:', error);
      // Return null if Redis is not available
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async set(key, value, mode, duration) {
    if (!this.client) return null;
    try {
      if (mode && duration) {
        return await this.client.set(key, value, mode, duration);
      }
      return await this.client.set(key, value);
    } catch (error) {
      console.error('Redis set error:', error);
      return null;
    }
  }

  async get(key) {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.client) return null;
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      return null;
    }
  }
}

module.exports = new RedisConnection();