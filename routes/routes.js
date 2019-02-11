var crypto = require("crypto");
const util = require("util");

var express = require("express");
var csrf = require("csurf");
var validator = require("validator");
var normalizeUrl = require("normalize-url");
var rndm = require("rndm");
var bcrypt = require("bcryptjs");

var dbQueries = require("../db/queries");
var config = require("../config");

var router = express.Router();

var csrfProtection = csrf({
	cookie: false
});

var promisfyCryptoScrypt = util.promisify(crypto.scrypt);

//=====================================================
// ROUTES
//=====================================================

function rateLimmiter(req, res, next) {
	if (req.session.lastAttempt && Date.now() - req.session.lastAttempt < 5000) {
		res.sendStatus(429);
		return;
	}
	next();
}

function disallowXHR(req, res, next) {
	if(req.xhr) {
		res.sendStatus(403);
		return;
	}
	next();
}

function checkShortUrlPresence(req, res, next) {
	if(!req.params.id) {
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
	} catch(error) {
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
		if(!noPassword) {
			res.render("passwordNeeded.njk", { message:"Password Required" });
			return;
		}

		let decrypted = await decrypt(urlData, "no");

		req.session.lastAttempt = undefined;
		res.redirect(decrypted);
	} catch (error) {
		if(error) {
			console.error(error);
			res.sendStatus(500);
			return;
		}
	}
}

async function linkPost(req, res) {
	req.session.lastAttempt = Date.now();
	try {
		let urlData = res.locals.urlData;

		let password = "no";
		let noPassword = await bcrypt.compare(password, urlData.password);
		if(!noPassword) {
			password = req.body.password || null;
			if(!password) {
				res.render("passwordNeeded.njk", { message:"Password Required" });
				return;
			}

			let correctPassword = await bcrypt.compare(password, urlData.password);
			if(!correctPassword) {
				res.render("passwordNeeded.njk", { message:"Wrong Password" });
				return;
			}
		}

		let decrypted = await decrypt(urlData, password);

		req.session.lastAttempt = undefined;
		res.redirect(decrypted);
	} catch (error) {
		if(error) {
			console.error(error);
			res.sendStatus(500);
			return;
		}
	}
}

async function shorternPost(req, res) {
	var url = req.body.url;

	if(!validator.isURL(url)) {
		res.redirect("/new?invalid=true");
		return;
	}
	url = normalizeUrl(url);
	let shortUrl;
	var password = req.body.password || "no";

	try {

		while(true) {
			shortUrl = rndm.base62(7);
			let present = await dbQueries.checkURL(shortUrl);
			if(present == 0) {
				break;
			}
		}

		let dataToSave = await encrypt(url, password);

		let response = await dbQueries.addURL(shortUrl, dataToSave);
		if(response == "OK") {
			res.locals.shortUrl = shortUrl;
			res.render("created.njk", { password: password});
		} else {
			throw new Error("Can't add to redis");
		}
	} catch (error) {
		if(error) {
			console.error(error);
			res.sendStatus(500);
			return;
		}
	}
}

async function decrypt(urlData, password) {
	try {
		let pwdBuff = Buffer.from(password);

		let iv = Buffer.from(urlData.iv, "hex");
		let salt = Buffer.from(urlData.salt, "hex");

		let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32);

		let decipher = crypto.createDecipheriv("aes-256-cbc", derivedKeyBuffer, iv);
		let decrypted = decipher.update(urlData.longURL, "hex", "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	} catch (error) {
		throw error;
	}
}

async function encrypt(url, password) {
	try {
		let passwordHash = await bcrypt.hash(password, 10);

		let pwdBuff = Buffer.from(password);

		let iv = crypto.randomBytes(16);
		let salt = crypto.randomBytes(12);

		let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32);

		let cipher = crypto.createCipheriv("aes-256-cbc", derivedKeyBuffer, iv);
		let encrypted = cipher.update(url, "utf8", "hex");
		encrypted += cipher.final("hex");

		return {
			iv: iv.toString("hex"),
			longURL: encrypted.toString("hex"),
			salt: salt.toString("hex"),
			password: passwordHash
		};
	} catch (error) {
		throw error;
	}
}

module.exports = router;