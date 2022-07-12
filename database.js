"use strict";

const mongoose = require("mongoose");

const DATABASE_NAME = "marketData";

const connectionURL = `mongodb://127.0.0.1:27017/${DATABASE_NAME}`;

mongoose
  .connect(connectionURL)
  .then(() => {
    console.log("DB connected successfully to ", DATABASE_NAME);
  })
  .catch((e) => {
    console.log("Failed to connect to DB Server");
  });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "DB connection error"));

db.once("open", () => {
  console.log("Connection opened with DB: ", DATABASE_NAME);
});
