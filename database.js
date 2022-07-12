"use strict";

const mongoose = require("mongoose");

const CONFIG = {
  DATABASE_NAME: "marketData",
  IP: "127.0.0.1",
  PORT: 27017,
};

const connectionURL = `mongodb://${CONFIG.IP}:${CONFIG.PORT}/${CONFIG.DATABASE_NAME}`;

mongoose
  .connect(connectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected successfully to", CONFIG.DATABASE_NAME);
  })
  .catch((e) => {
    console.log("Failed to connect to DB Server");
  });

// mongoose.set("debug", true); // Set the DEBUG mode

const db = mongoose.connection;
db.on("error", console.error.bind(console, "DB connection error"));

db.once("open", () => {
  console.log("Connection opened with DB:", CONFIG.DATABASE_NAME);
});
