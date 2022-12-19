import { URLObj } from "../../models/url_object";

function init(dbConfig) {
  if (dbConfig.type == "redis") {
    return initRedis(dbConfig);
  }
  //else if (dbConfig.type == "mysql") { };
}

function initRedis(redisConfig) {
  var client = require("./redis.js")(redisConfig);

  return {
    getURL: function (shortURL: string) {
      return client.hgetall(shortURL);
    },
    checkURL: function(shortURL: string) {
      return client.hexists(shortURL, "longURL");
    },
    addURL: function(shortURL: string, data:URLObj) {
      return client.hmset(shortURL, data);
    }
  };
}

module.exports = { init: init };
