"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const lastCheckedSchema = new Schema (
    {
        symbol: String,
        lastCheckedOn: String
    },
    {collection: "lastChecked"}
);

lastCheckedSchema.index({symbol: 1, timeStamp: 1}, {unique: true});

module.exports = mongoose.model("lastChecked", lastCheckedSchema);