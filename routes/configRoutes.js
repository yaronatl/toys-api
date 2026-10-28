const indexR = require("./index");
const usersR = require("./users");
const toysR = require("./toys");

exports.configRoutes = (app) => {
    app.use("/",indexR);
    app.use("/users",usersR);
    app.use("/toys",toysR);
}
