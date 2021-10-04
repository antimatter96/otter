import fs from "fs"
import path from "path"

var config = {};

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
