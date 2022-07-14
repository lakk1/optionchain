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
  ltp: Number,
  IV: Number,
  volume: Number,
  OI: Number,
  changeInOI: Number,
  TotalOI: Number,
  TotalVolume: Number,
  greeks: GreeksSchema,
});

const filteredDataSchema = new Schema(
  {
    sequence: Number,
    timeStamp: String,
    date: String,
    symbol: String,
    strikePrice: Number,
    expiryDate: String,
    CE: OptionSchema,
    PE: OptionSchema,
  },
  { collection: "filteredData" }
);

filteredDataSchema.index(
  { symbol: 1, timeStamp: 1, strikePrice: 1 },
  { unique: true }
);
filteredDataSchema.index({ symbol: 1, date: 1 });

module.exports = mongoose.model("filteredData", filteredDataSchema);
