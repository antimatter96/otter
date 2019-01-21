var client = require("./redis.js");

function getURL(shortURL) {
	return client.hgetall(shortURL);
}

function checkURL(shortURL) {
	return client.hexists(shortURL, "longURL");
}

function addURL(shortURL, data) {
	return client.hmset(shortURL, data);
}

module.exports = {
	checkURL: checkURL,
	addURL: addURL,
	getURL: getURL
};