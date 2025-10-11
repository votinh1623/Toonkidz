//database.config.js
module.exports = {
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/toonkidz',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6380'
  }
};