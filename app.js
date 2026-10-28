const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
require("./db/mongoConnect");
const { configRoutes } = require("./routes/configRoutes");

const app = express();

app.use(cors());
// the API docs page lives in public/
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

configRoutes(app);

app.use((req, res) => {
    res.status(404).json({ err: "Endpoint not found" })
})

app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500
    res.status(status).json({ err: status < 500 ? "Bad request: " + err.message : "Server error" })
})

const PORT = process.env.PORT || 3001;

// on Vercel the app is only exported, no listen
if (require.main === module) {
    const server = http.createServer(app);
    server.listen(PORT);
    console.log("http://localhost:" + PORT)
}

module.exports = app;
