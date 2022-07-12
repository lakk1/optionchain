"use strict";
const fs = require("fs");
const path = require("path");
const { getDataForCurrentExpiry } = require("../util");
const optionChainModel = require("./optionChainData.model");
const NSE = {};
module.exports = {
  NSE,
};

async function fetchNSEdata(symbol = "NIFTY", range = 10, expiry = 0) {
  let suffix =
    symbol == "NIFTY" || symbol == "BANKNIFTY" ? "indices" : "equities";
  let url = `https://www.nseindia.com/api/option-chain-${suffix}?symbol=${symbol}`;

  // let url = "https://www.nseindia.com/api/option-chain-equities?symbol=AARTIIND";

  console.log("URL: ", url);
  console.log("FILE: ", `./DATA/${symbol}/${symbol}.json`);

  let data = undefined;

  let filename = path.resolve(`./DATA/${symbol}/${symbol}.json`);
  console.log("Reading file", filename);

  data = await fs.promises.readFile(filename, "utf8");
  if (data) {
    console.log("GOT DATA From file:", filename);
    try {
      data = JSON.parse(data);
      let filteredData = getDataForCurrentExpiry(data, symbol, range, expiry);
      //   console.log("Returning filtered data", filteredData);
      return filteredData;
    } catch (e) {
      console.log("ERROR converting Option Data to JSON", e);
    }
  }
  console.log("FATAL: Failed to read file....", filename);
  return data;
}

NSE.fetchData = async (req, res) => {
  console.log("Fetching NSE data with ", req.params);

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

  //   return res.json({ NSEData: { a: 1, b: 2 } });
};

async function getPCDataFromDB(symbol, date) {
  let records = await optionChainModel.find({ symbol, date });
  //   console.log("Records: ", records);
  return records;
}

function today() {
  const date = new Date();
  const formattedDate = date
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
  return formattedDate;
}

NSE.getPutCallData = async (req, res) => {
  let symbol = req.params.symbol || "NIFTY";
  let date = req.params.date || today();

  let records = await getPCDataFromDB(symbol, date);
  res.json({ records });
};
