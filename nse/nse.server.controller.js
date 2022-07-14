"use strict";
const fs = require("fs");
const path = require("path");
const { getDataForCurrentExpiry, today } = require("../util");
const filteredDataModel = require("./filteredData.model");
const lastCheckedModel = require("./lastChecked.model");
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

NSE.getOptionChain = async (req, res) => {
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

NSE.getfilteredData = async (req, res) => {
  // GET: http://localhost:3000/nse/optionChain/BANKNIFTY/10/0
  console.log("Fetching NSE data with ", req.body);

  let symbol = req.body.symbol || "NIFTY";
  let date = req.body.date || today();
  let strikePrices = req.body.strikePrices;

  try {
      let records = await getfilteredDatafromDB(symbol, date, strikePrices);
      res.json({ records });
    } catch (e) {
    res.status(401).send(e);
  }

  //   return res.json({ NSEData: { a: 1, b: 2 } });
};

async function getfilteredDatafromDB(symbol, date, strikePrices) {
  let records = await filteredDataModel
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

NSE.getDBOptionChain = async (req, res) => {
  console.log("Fetching NSE data with ", req.params);

  let symbol = req.params.symbol || "NIFTY";

  try {
    let timeStamp = await lastCheckedModel.findOne({symbol}, "lastCheckedOn -_id");
    timeStamp = timeStamp.lastCheckedOn;

    let records = await optionChainModel.findOne({symbol, timeStamp})
    res.send(records)
  } catch (e) {
    res.status(401).send(e);
  }
};