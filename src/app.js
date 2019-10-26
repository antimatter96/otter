var express = require("express");
var nunjucks = require("nunjucks");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var RedisStore = require("connect-redis")(session);
var favicon = require("serve-favicon");
var path = require("path");
var morgan = require("morgan");
var redis = require("ioredis");

//==============================
// APP SETUP
//==============================
function createApp(CONFIG) {
  var app = express();

  app.use(favicon(path.join(__dirname + "./../public/favicon.ico")));
  app.set("views", path.join(__dirname + "./../views"));
  app.use("/static", express.static(path.join(__dirname + "./../public")));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.set("port", CONFIG.port);

  // Logging

  app.use(morgan("common", CONFIG.morgan));

  // Templates

  var nunjucksConfig = Object.assign({}, CONFIG.nunjucks);
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

  app.use(function(req, res, next) {
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

  app.use(function(req, res, _next) {
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

  app.use(function(err, req, res, next) {
    console.log(err);
    if (!err) {
      next();
    } else if (err.code === "EBADCSRFTOKEN") {
      res.status(403);
      res.send(formTamperedWithError);
      res.end();
    } else {
      next(err);
    }
  });

  app.use(function(err, req, res) {
    console.log("ERROR =>> ", err);
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: {}
    });
  });

  return app;
}

module.exports = createApp;
