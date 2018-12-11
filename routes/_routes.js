var crypto = require("crypto");
const util = require('util');


var express = require('express');
var csrf = require('csurf');
var validator = require("validator");
var normalizeUrl = require("normalize-url");
var rndm = require("rndm");

var dbQueries = require('../db/queries');
var config = require('../config');

var router = express.Router();

var csrfProtection = csrf({
	cookie: false
});


var promisfyCryptoScrypt = util.promisify(crypto.scrypt);


var formTamperedWithError = "Form Tampered With (- _ -)";

//=====================================================
// ROUTES
//=====================================================

function rateLimmiter(req, res, next) {
	if (req.session.lastAttempt && Date.now() - req.session.lastAttempt < 5000) {
		res.status(429).send({
			error: 429
		});
	} else {
		next();
	}
}

router.use(rateLimmiter);
router.use(csrfProtection);

router.get("/", mainGet);

router.get("/new", mainGet);
router.get("/i/:id", linkGet);
router.post("/i/:id", linkPost);

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

// function shorternGet(req, res) {
// 	if (req.query.invalid && req.query.invalid === "true") {
// 		res.render("home.njk", {
// 			message: "Enter a valid url",
// 			csrfToken: req.csrfToken()
// 		});
// 		return;
// 	}

// 	res.render("home.njk", {
// 		csrfToken: req.csrfToken()
// 	});
// }

function linkGet(req, res) {
	var shortUrl = req.params.id;
	if(!shortUrl) {
		res.redirect("/");
		return;
	}
	let _temp = dbQueries.checkURL(shortUrl)
	_temp.then((obj)=>{
		console.log(err);
	}).catch((err)=>{
		console.log(err);
	});

	client.hgetall(shortUrl, function(err, obj) {
		if(err) {
			res.sendStatus(500);
			return;
		}
		if(obj) {
			if(obj.pwd==="no") {
				res.redirect(obj.url);
			} else {
				if(!req.session.attempts) {
					req.session.attempts = 0;
				}
				req.session.attempts++;
				res.render("passwordNeeded.njk", {shortUrl:shortUrl, message:"Password Required", csrfToken:req.csrfToken()});
			}
		} else {
			res.sendStatus(404);
		}
	});
}

function linkPost(req, res) {
	if(!req.session.attempts) {
		req.session.attempts = 0;
	}
	req.session.attempts++;
	if(req.session.attempts>5) {
		res.sendStatus(429);
		return;
	}
	var shortUrl = req.params.id;
	if(!shortUrl) {
		res.redirect("/");
		return;
	}
	client.hgetall(shortUrl, function(err, obj) {
		if(err) {
			res.sendStatus(500);
			return;
		}
		if(!obj) {
			res.sendStatus(404);
			return;
		}

		if(obj.pwd === "no") {
			res.redirect(obj.url);
			return;
		}
		var password = req.body.password || null;
		if(!password) {
			res.render("passwordNeeded.njk", {shortUrl:shortUrl, message:"Password Required", csrfToken:req.csrfToken()});
			return;
		}
		password = decodeURI(password);
		bcrypt.compare(password, obj.pwd, function(err, result) {
			if(err) {
				res.sendStatus(500);
				return;
			}
			if(result) {
				var decipher = crypto.createDecipher("AES-192-CTR", password);
				var decrypted = decipher.update(obj.url, "hex", "utf8");
				decrypted += decipher.final("utf8");
				delete req.session.attempts;
				res.redirect(decrypted);
			} else {
				res.render("passwordNeeded.njk", {shortUrl:shortUrl, message:"Wrong Password", csrfToken:req.csrfToken()});
			}
		});
	});
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

		let urlBuff = Buffer.from(url);
		let pwdBuff = Buffer.from(password);

		let iv = crypto.randomBytes(8);
		let salt = crypto.randomBytes(12);

		let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 8);

		let cipher = crypto.createCipheriv("des", derivedKeyBuffer, iv);
		let _tempBuff = cipher.update(urlBuff);
		let encrypted = Buffer.concat([_tempBuff, cipher.final()]);
		console.log(encrypted.toString());

	} catch (error) {
		if(error) {
			console.error(error);
			res.sendStatus(500);
			return;
		}
	}

	// client.hgetall(shortUrl, function(err, obj) {
	// 	if(err) {
	// 		res.sendStatus(500);
	// 		return;
	// 	}
	// 	if(obj) {
	// 		shortUrl+=rndm.base62(3);
	// 	}
	// 	if(password!="no") {
	// 		var cipher = crypto.createCipher("AES-192-CTR", password);
	// 		var urlHash = cipher.update(url, "utf8", "hex");
	// 		urlHash += cipher.final("hex");
	// 		bcrypt.genSalt(10, function(err, salt) {
	// 			bcrypt.hash(password, salt, function(err, hash) {
	// 				client.hmset(shortUrl, "url", urlHash, "pwd", hash, function(err, reply) {
	// 					if(err) {
	// 						res.sendStatus(500);
	// 						return;
	// 					}

	// 					if(reply==="OK") {
	// 						res.render("created.njk", {shortUrl:req.hostname+"/i/"+shortUrl, password:password});
	// 					} else {
	// 						res.sendStatus(500);
	// 					}

	// 				});
	// 			});
	// 		});
	// 	} else {
	// 		client.hmset(shortUrl, "url", url, "pwd", "no", function(err, reply) {
	// 			if(err) {
	// 				res.sendStatus(500);
	// 				return;
	// 			}

	// 			if(reply === "OK") {
	// 				res.render("created.njk", {shortUrl:req.hostname+"/i/"+shortUrl, password:"no"});
	// 			} else {
	// 				res.sendStatus(500);
	// 			}
	// 		});
	// 	}
	// });
}

module.exports = router;