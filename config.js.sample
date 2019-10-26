const fs = require("fs");
const path = require("path");

const config = {};

config.nunjucksConfig = {};
config.sessionConfig = {};
config.redisConfig = {};

config.nunjucksConfig = {
  autoescape : true,
  watch : true,
  noCache : true,
};

config.sessionConfig = {
  resave: false,
  saveUninitialized: false,
  name: "appSessionId",
  cookie: { maxAge: 43200000 },
  secret : "secretkeyoflength256bits",
};

config.redisConfig = {
  host:"localhost",
  port:"6379",
};

config.port = 8000;

if (process.env.PRO == 1) {
  console.log("Using Production");
  config.nunjucksConfig.noCache = false;
  config.sessionConfig.secret = process.env.SESSION_SECRET;
  config.redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  };
  config.port = process.env.PORT || 8080;
  let accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
  config.morgan = { stream: accessLogStream };
} else {
  let accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
  config.morgan = { stream: accessLogStream };
}

config.crypto = {
  bcryptRounds : 10,
  scryptRounds : 16384,
};

module.exports = config;
