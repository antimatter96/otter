const fs = require("fs");
const path = require("path");

const config = {};

config.redisConfig = {};

config.redisConfig = {
  host:"localhost",
  port:"6379",
};

if (process.env.PRO == "1") {
  console.log("Using Production");
  config.redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  };
  let accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
  config.morgan = { stream: accessLogStream };
} else {
  let accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
  config.morgan = { stream: accessLogStream };
}


module.exports = config;

import {Config} from "./models/config/config"

var newConfig :Config = {
  cryptoConfig: {
    bcryptRounds: 10,
    scryptRounds: 16385
  },
  nunjucsConfig: {
    autoescape : true,
    watch : true,
    noCache : true,
  },
  port: 8080,
  sessionConfig: {
    resave: false,
    saveUninitialized: false,
    name: "appSessionId",
    cookie: { maxAge: 43200000 },
    secret : "secretkeyoflength256bits",
  }
}

if (process.env.PRO == "1") {
  newConfig.nunjucsConfig.noCache = false
  newConfig.sessionConfig.secret = "" + process.env.SESSION_SECRET;
  newConfig.port = parseInt("" + process.env.PORT, 10) || 8080;

}
