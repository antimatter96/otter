var express = require("express");
var csrf = require("csurf");
var validator = require("validator");
var normalizeUrl = require("normalize-url");
var rndm = require("rndm");
var bcrypt = require("bcrypt");

var dbQueries;
var customCrypto;

var router = express.Router();

var csrfProtection = csrf({
  cookie: false
});

// Middlewares

function rateLimmiter(req, res, next) {
  if (req.session.lastAttempt && Date.now() - req.session.lastAttempt < 5000) {
    res.sendStatus(429);
    return;
  }
  next();
}

function disallowXHR(req, res, next) {
  if (req.xhr) {
    res.sendStatus(403);
    return;
  }
  next();
}

function checkShortUrlPresence(req, res, next) {
  if (!req.params.id) {
    res.redirect("/");
    return;
  }
  next();
}

async function loadShortUrlData(req, res, next) {

  try {
    let urlData = await dbQueries.getURL(req.params.id);
    if (Object.keys(urlData).length === 0 && urlData.constructor === Object) {
      res.sendStatus(404);
      return;
    } else {
      res.locals.urlData = urlData;
      next();
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
    return;
  }

}

function exposeCSRFToken(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
}

function loadShortUrl(req, res, next) {
  res.locals.shortUrl = req.params.id;
  next();
}

router.use(rateLimmiter);
router.use(csrfProtection);
router.use(exposeCSRFToken);


router.get("/", mainGet);

router.get("/new", mainGet);
router.get("/i/:id", checkShortUrlPresence, loadShortUrlData, loadShortUrl, linkGet);
router.post("/i/:id", disallowXHR, checkShortUrlPresence, loadShortUrlData, loadShortUrl, linkPost);

router.post("/shorten", disallowXHR, shorternPost);
router.get("/shorten", mainGet);

function mainGet(req, res) {
  if (req.query.invalid && req.query.invalid === "true") {
    res.render("home.njk", {
      message: "Enter a valid url",
    });
    return;
  }
  res.render("home.njk");
}

async function linkGet(req, res) {
  try {
    let urlData = res.locals.urlData;

    let noPassword = await bcrypt.compare("no", urlData.password);
    if (!noPassword) {
      res.render("passwordNeeded.njk", { message: "Password Required" });
      return;
    }

    let decrypted = await customCrypto.decrypt(urlData, "no");

    req.session.lastAttempt = undefined;
    res.redirect(decrypted);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
    return;
  }
}

async function linkPost(req, res) {
  req.session.lastAttempt = Date.now();
  try {
    let urlData = res.locals.urlData;

    let password = "no";
    let noPassword = await bcrypt.compare(password, urlData.password);
    if (!noPassword) {
      password = req.body.password || null;
      if (!password) {
        res.render("passwordNeeded.njk", { message: "Password Required" });
        return;
      }

      let correctPassword = await bcrypt.compare(password, urlData.password);
      if (!correctPassword) {
        res.render("passwordNeeded.njk", { message: "Wrong Password" });
        return;
      }
    }

    let decrypted = await customCrypto.decrypt(urlData, password);

    req.session.lastAttempt = undefined;
    res.redirect(decrypted);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
    return;
  }
}

async function shorternPost(req, res) {
  var url = req.body.url;

  if (!url) {
    res.redirect("/new?invalid=true");
    return;
  }
  if (!validator.isURL(url)) {
    res.redirect("/new?invalid=true");
    return;
  }
  url = normalizeUrl(url);
  let shortUrl;

  // TODO : Limit password length
  var password = req.body.password || "no";

  try {

    // To-do : Limit this
    let tries = 5;
    let allBooked = true;
    while (tries > 0) {
      shortUrl = rndm.base62(7);
      let present = await dbQueries.checkURL(shortUrl);
      if (present == 0) {
        allBooked = false;
        break;
      }
      tries--;
    }

    if (allBooked) {
      throw new Error("No random key found");
    }

    let dataToSave = await customCrypto.encrypt(url, password);

    let response = await dbQueries.addURL(shortUrl, dataToSave);
    if (response == "OK") {
      res.locals.shortUrl = shortUrl;
      res.render("created.njk", { password: password });
    } else {
      throw new Error("Can't add to redis");
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
    return;
  }
}

function init(config) {
  config.redisConfig.type = "redis";
  dbQueries = require("../db/queries").init(config.redisConfig);
  customCrypto = require("../libs/customCrypto")(config.crypto);
  return router;
}

module.exports = init;
