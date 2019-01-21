const config = {};

config.nunjucksConfig = {};
config.sessionConfig = {};
config.redisConfig = {};

config.nunjucksConfig = {
	autoescape : true,
	watch : true,
	noCache : true,
};

config.sessionConfig = {
	resave: false,
	saveUninitialized: false,
	name: "appSessionId",
	cookie: { maxAge: 43200000 },
	secret : "secretkeyoflength256bits",
};

config.redisConfig = {
	host:"localhost",
	port:"6379",
};

config.port = 8000;

if (process.env.PRO == 1) {
	console.log("Using Production");
	config.nunjucksConfig.noCache = false;
	config.sessionConfig.secret = "secrcetodfw4sege34yhsaeffgh65d890tce5664esx0drandomlygenerated";
	config.redisConfig = {};
	config.port = process.env.PORT;
}

module.exports = config;