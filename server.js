/**
 * This is the main server file for starting NODE / Express server
 * Usage:
 * To run in devevlopment mode: > npm run dev
 * To run in normal mode: > node server.js
 * To run in STUB mode for API response : > npm run stub
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const { getDataForCurrentExpiry } = require("./util");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function fetchNSEdata(symbol = "NIFTY", range = 10, expiry = 0) {
  let suffix =
    symbol == "NIFTY" || symbol == "BANKNIFTY" ? "indices" : "equities";
  let url = `https://www.nseindia.com/api/option-chain-${suffix}?symbol=${symbol}`;

  // let url = "https://www.nseindia.com/api/option-chain-equities?symbol=AARTIIND";

  console.log("URL: ", url);

  let data = undefined;
  // data = require(`./DATA/${symbol}/${symbol}.json`);
  let filename = path.resolve(`./DATA/${symbol}/${symbol}.json`);
  console.log("Reading file", filename);
  data = await fs.promises.readFile(filename, "utf8");
  if (data) {
    console.log("GOT DATA From:", filename);
    data = JSON.parse(data);
    // console.log("Calling getDataForCurrentExpiry:", symbol, range, expiry);

    filteredData = getDataForCurrentExpiry(data, symbol, range, expiry);
    // console.log("Returning filtered data", filteredData);
    return filteredData;
  }
  console.log("Failed to read file....", filename);
  return data;
}

app.get("/nse/:symbol/:range/:expiry", async (req, res) => {
  let symbol = req.params.symbol || "NIFTY";
  let range = req.params.range || 25;
  let expiry = Number(req.params.expiry) || 0;

  try {
    let data = await fetchNSEdata(symbol, range, expiry);
    console.log("");
    res.send(data);
  } catch (e) {
    res.status(401).send(e);
  }
});

app.listen(port, () => {
  console.log(`CAR is listening on port ${port}`);
});
