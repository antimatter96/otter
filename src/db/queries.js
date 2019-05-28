function init(redisConfig) {
	var client = require("./redis.js")(redisConfig);

	return {
		getURL: function (shortURL) {
			return client.hgetall(shortURL);
		},
		checkURL: function(shortURL) {
			return client.hexists(shortURL, "longURL");
		},
		addURL: function(shortURL, data) {
			return client.hmset(shortURL, data);
		}
	};
}

module.exports = init;
