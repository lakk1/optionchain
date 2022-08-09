/**
 * This is the main server file for starting NODE / Express server
 * Usage:
 * To run in devevlopment mode: > npm run dev
 * To run in normal mode: > node server.js
 * To run in STUB mode for API response : > npm run stub
 */

"use strict";

const cluster = require("cluster");

if (cluster.isMaster) {
  let workerCount = require("os").cpus().length;

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on("online", (worker) => {
    console.log("Worker: " + worker.process.pid + " is online");
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died with code ${code} and signal ${signal}`
    );

    // cluster.fork();
  });

  process.on("uncaughtException", (err) => {
    console.log(err.stack);
    console.log("Node NOT exiting");
  });
} else {
  require("./database"); // Establish connection with DB
  // Actual program
  const compression = require("compression");
  const bodyParser = require("body-parser");
  const parseurl = require("parseurl");
  const express = require("express");
  const fs = require("fs");
  const path = require("path");
  const symbols = require("./symbols.json");
  let https = require("https");

  const port = process.env.PORT || 80;
  const app = express();
  // Compress all HTTP responses
  app.use(compression());

  let router = express.Router();

  app.use(router);

  router.use(bodyParser.json());
  router.use(
    bodyParser.urlencoded({
      extended: false,
    })
  );

  require("./routes")(router);

  router.get("/symbols", (req, res) => res.send(symbols));

  app.use(express.static("public"));

  app.use(function (req, res, next) {
    let url = parseurl(req);
    console.log("Requesting Data for", url.path);

    // res.setHeader("ngrok-skip-browser-warning", "skipme");
    // res.setHeader("User-Agent", "ngrok-skip-browser-warning");
    next();
  });

  app.get("/h", (req, res) => {
    res.send("Hello, CG!");
  });

  /*
  let certfile = fs.readFileSync(path.join(__dirname, "ssl", "cert.pem"));
  let keyfile = fs.readFileSync(path.join(__dirname, "ssl", "key.pem"));
  const secureserver = https.createServer(
    { cert: certfile, key: keyfile, passphrase: "secret" },
    app
  );
  //*/

  // secureserver.listen(port, (e) => {
  app.listen(port, (e) => {
    if (e) {
      return console.log("Failed to start server", e);
    }

    console.log(`CAR is listening on port ${port}`);
  });
}
