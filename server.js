var config = require("./config");

const app = require("./src/app")(config);

app.listen(app.get("port"), function() {
  console.log("Running on port " + app.get("port"));
});
