var nunjucks = require("nunjucks");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var RedisStore = require("connect-redis")(session);
var favicon = require("serve-favicon");
var path = require("path");
var morgan = require("morgan");

import redis from "ioredis"

import express, {Response, Request} from "express"
import session from "express-session"
import { Config } from "../models/config/config";

//==============================
// APP SETUP
//==============================
function createApp(CONFIG:Config) :express.Application{
  let app = express();

  app.use(favicon(path.join(__dirname + "./../public/favicon.ico")));
  app.set("views", path.join(__dirname + "./../views"));
  app.use("/static", express.static(path.join(__dirname + "./../public")));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.set("port", CONFIG.port);

  // Logging

  app.use(morgan("common", CONFIG.morganConfig));

  // Templates

  var nunjucksConfig = Object.assign({}, CONFIG.nunjucsConfig);
  nunjucksConfig.express = app;

  nunjucks.configure(app.get("views"), nunjucksConfig);

  // Session
  var sessionConfig = Object.assign({}, CONFIG.sessionConfig);
  var sessionRedisClient = new redis(CONFIG.redisConfig);
  sessionConfig.store = new RedisStore({client: sessionRedisClient});

  app.use(session(sessionConfig));

  //==================================
  // CUSTOM MIDDLEWARE
  //==================================

  app.use(function(_req:Request, res:Response, next:CallableFunction) {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Powered-By", "none");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  var formTamperedWithError = "Form Tampered With (- _ -)";

  //=====================================================
  // ROUTES
  //=====================================================

  var routes = require("./routes/routes")(CONFIG);
  app.use("/", routes);

  app.use(function(_req, res, _next) {
    res.status(404);
    res.format({
      html: function() {
        res.render("404.njk");
      },
      json: function() {
        res.json({ error: "Not found" });
      },
      default: function() {
        res.type("txt").send("Not found");
      }
    });
  });

  app.use(function(err:Error, req:Request, res:Response, next:CallableFunction) {
    console.log(err);
    if (!err) {
      next();
    // } else if (err.code === "EBADCSRFTOKEN") {
    //   res.status(403);
    //   res.send(formTamperedWithError);
    //   res.end();
    } else {
      next(err);
    }
  });

  app.use(function(err:Error, req:Request, res:Response) {
    console.log("ERROR =>> ", err);
    //res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: {}
    });
  });

  return app;
}

module.exports = createApp;
