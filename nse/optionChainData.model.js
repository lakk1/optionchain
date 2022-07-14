"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GreeksSchema = new Schema({
  delta: Number,
  theta: Number,
  gamma: Number,
  vega: Number,
});

const OptionSchema = new Schema({
    strikePrice: Number,
    expiryDate: String,
    underlying: String,
    identifier: String,
    openInterest: Number,
    changeinOpenInterest: Number,
    pchangeinOpenInterest: Number,
    totalTradedVolume: Number,
    impliedVolatility: Number,
    lastPrice: Number,
    change: Number,
    pChange: Number,
    totalBuyQuantity: Number,
    totalSellQuantity: Number,
    bidQty: Number,
    bidprice: Number,
    askQty: Number,
    askPrice: Number,
    underlyingValue: Number,
    greeks: GreeksSchema
   }
);

const dataSchema = new Schema(
  {
    strikePrice: Number,
    expiryDate: String,
    CE: OptionSchema,
    PE: OptionSchema
  }
);

const recordsSchema = new Schema(
  {
    expiryDates: [String],
    data: [dataSchema],
    timestamp: String,
    underlyingValue: Number,
    strikePrices: [Number]
  }
);

const OISchema = new Schema(
  {
    totOI: Number,
    totVol: Number
  }
);

const filteredShema = new Schema(
  {
    data: [dataSchema],
    CE: OISchema,
    PE: OISchema
  }
);

const fullDataSchema = new Schema(
  {
    records: recordsSchema,
    filtered: filteredShema
});

const OptionChainSchema = new Schema(
  {
    sequence: Number,
    timeStamp: String,
    date: String,
    symbol: String,
    data: fullDataSchema
  },
  { collection: "optionChainData" }
);

OptionChainSchema.index(
  { symbol: 1, timeStamp: 1 },
  { unique: true }
);
OptionChainSchema.index({ symbol: 1, date: 1 });

module.exports = mongoose.model("OptionChainData", OptionChainSchema);
