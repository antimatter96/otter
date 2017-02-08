var express = require('express');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var validator = require('validator');
var morgan = require('morgan');
var bcrypt = require('bcryptjs');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
//var uuidV4 = require('uuid/v4');
//var helmet = require('helmet');
var redis = require('redis');
var favicon = require('serve-favicon');
var rndm = require('rndm');
var normalizeUrl = require('normalize-url');
//==============================
// APP SETUP
//==============================

var app = express();
app.use(favicon(__dirname + '/public/favicon.ico'));
app.set('views', __dirname + '/views');
app.set('port', process.env.PORT || 8080);
app.use('/static', express.static('public'));
if(process.env.PRO!=1){
	app.use(morgan('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//===============================
//TEMPLATE
//===============================
if(process.env.PRO==1){
	nunjucks.configure(app.get('views'), {
		autoescape: true,
		noCache: false,
		watch: true,
		express: app
	});
}
else{
	nunjucks.configure(app.get('views'), {
		autoescape: true,
		noCache: true,
		watch: true,
		express: app
	});
}


//===============================
//DATABASE
//===============================

if(process.env.PRO==1){
	var client = redis.createClient({
		host:'pub-redis-12002.ap-southeast-1-1.1.ec2.garantiadata.com',
		port:'12002',
		pass:process.env.redispassword
	})
}
else{
	var client = redis.createClient({
		host:'localhost',
		port:'6379'
	})
}

//===============================
//SESSEION
//===============================

if(process.env.PRO==1){
	app.use(session({
		secret: "secrcetodfw4sege34yhsaefd",
		resave: false,
		saveUninitialized: false,
		name:'appSessionId',
		store: client
	}));
}
else{
	app.use(session({
		secret: "secretkeyoflength256bits",
		resave: false,
		saveUninitialized: false,
		name:'appSessionId',
		store: client
	}));
}

//================================== 
// CUSTOM MIDDLEWARE
//==================================

app.all('*',(req,res,next)=>{
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
	res.setHeader("X-powered-by", "none");
	next();
})

//=====================================================
// ROUTES
//=====================================================

app.get('/',function(req,res){
	if(req.query.invalid&&req.query.invalid==="true"){
		res.render('home.njk',{message:'Enter a valid url'});
	}
	else{
		res.render('home.njk');
	}
})

app.get('/new',function(req,res){
	if(req.query.invalid&&req.query.invalid==="true"){
		res.render('home.njk',{message:'Enter a valid url'});
	}
	else{
		res.render('home.njk');
	}
})

app.get('/i/:id',function(req,res){
	var password = req.query.password || null;
	var shortUrl = req.params.id;
	if(shortUrl){
		client.hgetall(shortUrl,function(err,obj){
			if(err){
				res.sendStatus(404);
			}
			if(obj){
				var valid = false;
				if(obj.pwd==="no"){
					res.sendStatus(403);
					//valid = true;
				}
				else{
					if(password){
						bcrypt.compare(password, obj.pwd, function(err, result) {
							if(err){
								res.sendStatus(403);
							}
							if(result){
								res.redirect(obj.url);
							}
							else{
								res.sendStatus(403);
							}
						});
					}
					else{
						res.sendStatus(403);
					}
				}
			}
			else{
				res.sendStatus(404);
			}
		})
	}
	else{
		res.redirect('/');
	}
});

app.post('/shorten',function(req,res){
	if(req.xhr){
		res.sendStatus(401);
	}
	var url = req.body.url;
	if(!validator.isURL(url)){
		res.redirect('/new?invalid=true');
	}
	else{
		url = normalizeUrl(url);
		var shortUrl = rndm.base62(7);
		var password = req.body.password || "no";
		var passwordHash;
		client.hgetall(shortUrl,function(err,obj){
			if(err){					
				res.sendStatus(401);
			}
			if(obj){
				shortUrl+=rndm.base62(3);
			}
			if(password!="no"){
				bcrypt.genSalt(10, function(err, salt) {
					bcrypt.hash(password, salt, function(err, hash) {
						client.hmset(shortUrl, "url", url , "pwd", hash , function(err,reply){
							if(err){
								//console.log(err);
								res.sendStatus(401);
							}
							else{
								if(reply==="OK"){
									res.render('created.njk',{shortUrl:req.hostname+"/i/"+shortUrl+"?password=" + password});
								}
								else{
									res.sendStatus(401);
								}
							}
						});
					});
				});
			}
			else{
				client.hmset(shortUrl, "url", url , "pwd", "no" , function(err,reply){
					if(err){
						//console.log(err);
						res.sendStatus(401);
					}
					else{
						if(reply==="OK"){
							res.render('created.njk',{shortUrl:req.hostname+"/i/"+shortUrl});
						}
						else{
							res.sendStatus(401);
						}
					}
				});
			}		
		});
	}
	
})

app.get('/shorten',function(req,res){
	res.redirect('/');
});

app.use(function(req, res, next) {
    res.status(404);
    res.render('404.njk');
});

app.listen(app.get('port'), function() {
	console.log("Running on port " + app.get('port'));
});
