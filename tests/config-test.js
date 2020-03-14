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

config.nunjucksConfig.noCache = false;
config.accessLogStream = null;

config.morgan = {
  skip: function (_req, _res) { return true; }
};

config.crypto = {
  bcryptRounds : 1,
  scryptRounds : 2,
};

module.exports = config;
