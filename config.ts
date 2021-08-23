import fs from "fs"
import path from "path";

import { Config } from "./models/config/config"

var newConfig: Config = {
  cryptoConfig: {
    bcryptRounds: 10,
    scryptRounds: 16385
  },
  nunjucsConfig: {
    autoescape: true,
    watch: true,
    noCache: true,
  },
  port: 8080,
  sessionConfig: {
    resave: false,
    saveUninitialized: false,
    name: "appSessionId",
    cookie: { maxAge: 43200000 },
    secret: "secretkeyoflength256bits",
  },
  redisConfig: {
    host: "localhost",
    port: 6379,
  },
  morganConfig: {
    stream: fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" })
  }
}

if (process.env.PRO == "1") {
  newConfig.nunjucsConfig.noCache = false
  newConfig.sessionConfig.secret = "" + process.env.SESSION_SECRET;
  newConfig.port = parseInt("" + process.env.PORT, 10) || 8080;

  newConfig.redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD
  };
}

module.exports = newConfig;
