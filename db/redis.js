var redis = require("ioredis");

var redisConfig = require("../config").redisConfig;


var client = redis.createClient(redisConfig);

module.exports = client;
