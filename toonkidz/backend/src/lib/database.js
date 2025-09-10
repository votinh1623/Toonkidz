const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');
const config = require('../config/database.config');

class DatabaseConnection {
  constructor() {
    this.mongoConnection = null;
    this.redisClient = null;
  }

  async connectMongo() {
    if (this.mongoConnection) return this.mongoConnection;
    
    try {
      this.mongoConnection = await mongoose.connect(config.mongo.uri, config.mongo.options);
      console.log('MongoDB connected successfully');
      return this.mongoConnection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async connectRedis() {
    if (this.redisClient) return this.redisClient;
    
    try {
      this.redisClient = redis.createClient(config.redis.url);
      
      // Promisify Redis methods
      this.redisClient.get = promisify(this.redisClient.get).bind(this.redisClient);
      this.redisClient.set = promisify(this.redisClient.set).bind(this.redisClient);
      this.redisClient.del = promisify(this.redisClient.del).bind(this.redisClient);
      
      await this.redisClient.connect();
      console.log('Redis connected successfully');
      return this.redisClient;
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
    
  }

  async disconnect() {
    if (this.mongoConnection) {
      await mongoose.disconnect();
      this.mongoConnection = null;
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

module.exports = new DatabaseConnection();