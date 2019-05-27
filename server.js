const app = require("./src/app");

app.listen(app.get("port"), function() {
	console.log("Running on port " + app.get("port"));
});
