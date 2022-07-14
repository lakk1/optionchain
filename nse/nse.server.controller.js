"use strict";
const fs = require("fs");
const path = require("path");
const { getDataForCurrentExpiry, today } = require("../util");
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
  // GET: http://localhost:3000/nse/optionChain/BANKNIFTY/10/0
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

NSE.fetchfilteredData = async (req, res) => {
  // GET: http://localhost:3000/nse/optionChain/BANKNIFTY/10/0
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

async function getPCDataFromDB(symbol, date, strikePrices) {
  let records = await optionChainModel
    .find(
      {
        symbol,
        date,
        strikePrice: { $in: strikePrices },
      },
      "-_id -CE._id -PE._id -CE.greeks._id -PE.greeks._id "
    )
    .sort({ sequence: "asc" });
  //   console.log("Records: ", records);
  return records;
}

NSE.getPutCallData = async (req, res) => {
  // GET: http://localhost:3000/nse/putCallData/NIFTY/12-Jul-2022

  let symbol = req.params.symbol || "NIFTY";
  let date = req.params.date || today();
  let strikePrices = req.params.strikePrices || [
    15000, 15100, 15200, 15300, 15400, 15500, 15600, 15700, 15900, 15900, 16000,
    16100, 16200, 16300, 16400, 16500,
  ];

  let records = await getPCDataFromDB(symbol, date, strikePrices);
  res.json({ records });
};
