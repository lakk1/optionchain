"use strict";
const fs = require("fs");
const path = require("path");
const { getNSEdata, today } = require("../util");
const filteredDataModel = require("./filteredData.model");
const lastCheckedModel = require("./lastChecked.model");
const optionChainModel = require("./optionChainData.model");
const NSE = {};
module.exports = {
  NSE,
};

async function fetchNSEdata(expiry, symbol = "NIFTY", range = 10) {
  // console.log("Fetching NSE Data for ", symbol, range, expiry);
  let suffix =
    symbol == "NIFTY" || symbol == "BANKNIFTY" ? "indices" : "equities";
  let url = `https://www.nseindia.com/api/option-chain-${suffix}?symbol=${symbol}`;

  // let url = "https://www.nseindia.com/api/option-chain-equities?symbol=AARTIIND";

  console.log("URL: ", url);
  // console.log("FILE: ", `./DATA/${symbol}/${symbol}.json`);

  let data = undefined;

  let filename = path.resolve(`./DATA/${symbol}/${symbol}.json`);

  data = await fs.promises.readFile(filename, "utf8");
  if (data) {
    console.log("GOT DATA From file:", filename);
    try {
      data = JSON.parse(data);
      let filteredData = getNSEdata(data, symbol, expiry, range);
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
  let expiry = req.params.expiry != "undefined" ? req.params.expiry : today();

  try {
    let data = await fetchNSEdata(expiry, symbol, range);
    res.send(data);
  } catch (e) {
    res.status(401).send(e);
  }

  //   return res.json({ NSEData: { a: 1, b: 2 } });
};

async function getExpiryDatesFromFile(symbol) {
  let filename = path.resolve(`./DATA/${symbol}/${symbol}_expiry.json`);
  try {
    let data = await fs.promises.readFile(filename, "utf8");
    let expiryDates = JSON.parse(data);
    let expTime = new Date(expiryDates[0] + " 15:35:00").getTime();
    let curTime = new Date().getTime();
    let count = 3;
    if (expTime < curTime) {
      count++;
    }

    expiryDates = expiryDates.slice(0, count);

    if (data) {
      return expiryDates;
    } else {
      return [];
    }
  } catch (e) {
    console.log("ERROR finding expiry dates", e);
    return [];
  }
}

NSE.getExpiryDates = async (req, res) => {
  console.log("Fetching Expiry Dates for ", req.params);
  let symbol = req.params.symbol || "NIFTY";

  try {
    let data = await getExpiryDatesFromFile(symbol);

    res.send(data);
  } catch (e) {
    console.log("ERROR finding expiry dates", e);
    res.status(401).send(e);
  }
};

NSE.getPutCallOiChange = async (req, res) => {
  let symbol = req.body.symbol || "NIFTY";
  console.log("getPutCallOiChange invoked for ", symbol);
  // let date = req.body.date || today();
  let strikePrices = req.body.strikePrices;
  let timeStamp = await lastCheckedModel.findOne(
    { symbol },
    "lastCheckedOn -_id"
  );
  let date = timeStamp.lastCheckedOn.split(" ")[0];

  // console.log("strikePrices", strikePrices);
  try {
    let records = await filteredDataModel.aggregate([
      {
        $match: {
          symbol: symbol,
          date: date,
          strikePrice: {
            $in: strikePrices,
          },
        },
      },
      {
        $group: {
          _id: "$timeStamp",
          CE_OI_CHANGE_SUM: {
            $sum: "$CE.changeInOI",
          },
          PE_OI_CHANGE_SUM: {
            $sum: "$PE.changeInOI",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json({ records });
  } catch (e) {
    res.status(401).send(e);
  }
};

NSE.getMarketPrice = async (req, res) => {
  let symbol = req.body.symbol || "NIFTY";
  console.log("getMarketPrice invoked for ", symbol);
  // let date = req.body.date || today();
  let strikePrices = req.body.strikePrices;
  let timeStamp = await lastCheckedModel.findOne(
    { symbol },
    "lastCheckedOn -_id"
  );
  let date = timeStamp.lastCheckedOn.split(" ")[0];

  // console.log("strikePrices", strikePrices);
  try {
    let records = await filteredDataModel
      .find(
        { symbol: symbol, date: date },
        "-_id marketPrice sequence timestamp"
      )
      .sort({ sequence: "asc" });

    res.json({ records });
  } catch (e) {
    res.status(401).send(e);
  }
};

NSE.getPutCallOiSum = async (req, res) => {
  let symbol = req.body.symbol || "NIFTY";
  // let date = req.body.date || today();
  let strikePrices = req.body.strikePrices;
  let timeStamp = await lastCheckedModel.findOne(
    { symbol },
    "lastCheckedOn -_id"
  );
  let date = timeStamp.lastCheckedOn.split(" ")[0];

  // console.log("strikePrices", strikePrices);
  try {
    let records = await filteredDataModel.aggregate([
      {
        $match: {
          symbol: symbol,
          date: date,
          strikePrice: {
            $in: strikePrices,
          },
        },
      },
      {
        $group: {
          _id: "$timeStamp",
          CE_OI_SUM: {
            $sum: "$CE.OI",
          },
          PE_OI_SUM: {
            $sum: "$PE.OI",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json({ records });
  } catch (e) {
    res.status(401).send(e);
  }
};

NSE.getfilteredData = async (req, res) => {
  // GET: http://localhost:3000/nse/optionChain/BANKNIFTY/10/0
  console.log("Fetching OI Series data with ", req.body);

  let symbol = req.body.symbol || "NIFTY";
  // let date = req.body.date || today();
  let timeStamp = await lastCheckedModel.findOne(
    { symbol },
    "lastCheckedOn -_id"
  );
  let date = timeStamp.lastCheckedOn.split(" ")[0];

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
    let timeStamp = await lastCheckedModel.findOne(
      { symbol },
      "lastCheckedOn -_id"
    );
    timeStamp = timeStamp.lastCheckedOn;

    let records = await optionChainModel.findOne({ symbol, timeStamp });
    res.send(records);
  } catch (e) {
    res.status(401).send(e);
  }
};
