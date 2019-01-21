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
	console.log(req.session.lastAttempt, Date.now() - req.session.lastAttempt);
	if (req.session.lastAttempt && Date.now() - req.session.lastAttempt < 5000) {
		res.sendStatus(429);
		return;
	} else {
		next();
	}
}

function checkShortUrlPresence(req, res, next) {
	if(!req.params.id) {
		res.redirect("/");
		return;
	} else {
		next();
	}
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

router.use(rateLimmiter);
router.use(csrfProtection);

router.get("/", mainGet);

router.get("/new", mainGet);
router.get("/i/:id", checkShortUrlPresence, loadShortUrlData, linkGet);
router.post("/i/:id", checkShortUrlPresence, loadShortUrlData, linkPost);

router.post("/shorten", shorternPost);
router.get("/shorten", mainGet);

function mainGet(req, res) {
	if (req.query.invalid && req.query.invalid === "true") {
		res.render("home.njk", {
			message: "Enter a valid url",
			csrfToken: req.csrfToken()
		});
		return;
	}

	res.render("home.njk", {
		csrfToken: req.csrfToken()
	});
}

async function linkGet(req, res) {
	var shortUrl = req.params.id;

	try {
		let urlData = res.locals.urlData;

		let noPassword = await bcrypt.compare("no", urlData.password);
		if(!noPassword) {
			res.render("passwordNeeded.njk", {shortUrl:shortUrl, message:"Password Required", csrfToken:req.csrfToken()});
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
	var shortUrl = req.params.id;

	req.session.lastAttempt = Date.now();
	try {
		let urlData = res.locals.urlData;

		let password = "no";
		let noPassword = await bcrypt.compare(password, urlData.password);
		if(!noPassword) {
			password = req.body.password || null;
			if(!password) {
				res.render("passwordNeeded.njk", {shortUrl:shortUrl, message:"Password Required", csrfToken:req.csrfToken()});
				return;
			}

			let correctPassword = await bcrypt.compare(password, urlData.password);
			if(!correctPassword) {
				res.render("passwordNeeded.njk", {shortUrl:shortUrl, message:"Wrong Password", csrfToken:req.csrfToken()});
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
	if(req.xhr) {
		res.sendStatus(403);
		return;
	}
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

		let passwordHash = await bcrypt.hash(password, 10);

		let pwdBuff = Buffer.from(password);

		let iv = crypto.randomBytes(16);
		let salt = crypto.randomBytes(12);

		let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32);

		let cipher = crypto.createCipheriv("aes-256-cbc", derivedKeyBuffer, iv);
		let encrypted = cipher.update(url, "utf8", "hex");
		encrypted += cipher.final("hex");

		let dataToSave = {
			iv: iv.toString("hex"),
			longURL: encrypted.toString("hex"),
			salt: salt.toString("hex"),
			password: passwordHash
		};

		let response = await dbQueries.addURL(shortUrl, dataToSave);

		if(response == "OK") {
			res.render("created.njk", {shortUrl: `${req.hostname}/i/${shortUrl}`, password: password});
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

module.exports = router;