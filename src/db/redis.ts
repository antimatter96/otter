var redis = require("ioredis");

function createClient(redisConfig) {
  return redis.createClient(redisConfig);
}

module.exports = createClient; 
