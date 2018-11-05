var express = require("express");
var nunjucks = require("nunjucks");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var validator = require("validator");
var morgan = require("morgan");
var bcrypt = require("bcryptjs");
var session = require("express-session");
var RedisStore = require("connect-redis")(session);
//var uuidV4 = require('uuid/v4');
//var helmet = require('helmet');
var redis = require("redis");
var favicon = require("serve-favicon");
var rndm = require("rndm");
var normalizeUrl = require("normalize-url");
var csrf = require("csurf");
var crypto = require("crypto");

//==============================
// APP SETUP
//==============================

var app = express();

app.use(favicon( __dirname + "/public/favicon.ico"));
app.set("views", __dirname + "/views");
app.use("/static", express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.set("port", process.env.PORT || 8000);

if(process.env.PRO!=1) {
	app.use(morgan("dev"));
}

//===============================
//TEMPLATE
//===============================

var nunjucksConfig = {
	autoescape: true,
	noCache: true,
	watch: true,
	express: app
};

if(process.env.PRO==1) {
	nunjucksConfig.noCache = false;
}

nunjucks.configure(app.get("views"), nunjucksConfig);

//===============================
//DATABASE
//===============================

var redisConfig;
if(process.env.PRO==1) {
	redisConfig = {
		host:"pub-redis-12002.ap-southeast-1-1.1.ec2.garantiadata.com",
		port:"12002",
		password:process.env.redispassword
	};
}
else {
	redisConfig = {
		host:"localhost",
		port:"6379"
	};
}

var client = redis.createClient(redisConfig);

//===============================
//SESSEION
//===============================


app.use(session({
	secret: "secretkeyoflength256bits",
	resave: false,
	saveUninitialized: false,
	name:"appSessionId",
	cookie: { maxAge: 600000 },
	store: new RedisStore(redisConfig),
}));

//==================================
// CUSTOM MIDDLEWARE
//==================================

app.use(function(req, res, next) {
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
	res.setHeader("X-powered-by", "none");
	next();
});

//================================
// 
//================================

var csrfProtection = csrf({cookie:false});

//=====================================================
// ROUTES
//=====================================================

app.get("/", csrfProtection, function(req, res) {
	if(req.query.invalid&&req.query.invalid==="true") {
		res.render("home.njk", {message:"Enter a valid url", csrfToken:req.csrfToken()});
	} else {
		res.render("home.njk", {csrfToken:req.csrfToken()});
	}
});

app.get("/new", csrfProtection, function(req, res) {
	if(req.query.invalid&&req.query.invalid==="true") {
		res.render("home.njk", {message:"Enter a valid url", csrfToken:req.csrfToken()});
	} else {
		res.render("home.njk", {csrfToken:req.csrfToken()});
	}
});

app.get("/i/:id", csrfProtection, function(req, res) {
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
});

app.post("/i/:id", csrfProtection, function(req, res) {
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
});


app.post("/shorten", csrfProtection, function(req, res) {
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
	var shortUrl = rndm.base62(7);
	var password = req.body.password || "no";
	client.hgetall(shortUrl, function(err, obj) {
		if(err) {
			res.sendStatus(500);
			return;
		}
		if(obj) {
			shortUrl+=rndm.base62(3);
		}
		if(password!="no") {
			var cipher = crypto.createCipher("AES-192-CTR", password);
			var urlHash = cipher.update(url, "utf8", "hex");
			urlHash += cipher.final("hex");
			bcrypt.genSalt(10, function(err, salt) {
				bcrypt.hash(password, salt, function(err, hash) {
					client.hmset(shortUrl, "url", urlHash, "pwd", hash, function(err, reply) {
						if(err) {
							res.sendStatus(500);
							return;
						}

						if(reply==="OK") {
							res.render("created.njk", {shortUrl:req.hostname+"/i/"+shortUrl, password:password});
						} else {
							res.sendStatus(500);
						}

					});
				});
			});
		} else {
			client.hmset(shortUrl, "url", url, "pwd", "no", function(err, reply) {
				if(err) {
					res.sendStatus(500);
					return;
				}

				if(reply === "OK") {
					res.render("created.njk", {shortUrl:req.hostname+"/i/"+shortUrl, password:"no"});
				} else {
					res.sendStatus(500);
				}
			});
		}
	});
});

app.get("/shorten", function(req, res) {
	res.redirect("/");
});

app.use(function(err, req, res, next) {
	if(!err) {
		next();
	} else if (err.code !== "EBADCSRFTOKEN") {
		next(err);
	} else {
		res.status(403);
		res.send("Form Tampered With");
	}
});

app.use(function(req, res, _next) {
	res.status(404);
	res.render("404.njk");
});

app.listen(app.get("port"), function() {
	console.log("Running on port " + app.get("port"));
});
