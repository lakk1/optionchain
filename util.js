const e = require("express");
const fs = require("fs");
const path = require("path");
const stockList = require("./symbols.json");

function getStrikePriceRange(symbol = "NIFTY", spotPrice = 10000, range = 10) {
  let symbolDetails = stockList.filter((s) => s.symbol == symbol)[0];
  const strikeInterval = symbolDetails.steps;

  let ATM = Math.round(spotPrice / strikeInterval) * strikeInterval;

  let ce = [];
  let pe = [];
  for (i = range; i > 0; i--) {
    let otm = ATM + strikeInterval * i;
    let itm = ATM - strikeInterval * i;
    ce.push(otm);
    pe.push(itm);
  }
  return { ATM, INTERVAL: strikeInterval, STRIKES: [...pe, ATM, ...ce] };
}

function calculateOIaction({ oiChange, priceChange } = options) {
  // LB: Long Buildup (OI Change > 0, Price Change > 0), LU: Long Unwinding (OI Change < 0, Price Change < 0)
  // SB: Short Buildup (OI Change > 0, Price Change < 0) , SC: Short Covering (OI Change < 0, Price Change > 0)

  if (priceChange > 0 && oiChange > 0) return { action: "LB", direction: "UP" };
  if (priceChange > 0 && oiChange < 0) return { action: "SC", direction: "UP" };
  if (priceChange < 0 && oiChange < 0)
    return { action: "LU", direction: "DOWN" };
  if (priceChange < 0 && oiChange > 0)
    return { action: "SB", direction: "DOWN" };
  return "";
}

function calculateTotals(filteredStrikes, ATM, INTERVAL) {
  let totals = {
    CE: {
      oi: 0,
      volume: 0,
      oiChange: 0,
      volumeList: [],
      oiList: [],
      oiChgList: [],
    },
    PE: {
      oi: 0,
      volume: 0,
      oiChange: 0,
      volumeList: [],
      oiList: [],
      oiChgList: [],
    },
    apexChart: {
      series: [],
      PEoiChg: [],
      CEoiChg: [],
      PEoi: [],
      CEoi: [],
      PEvolume: [],
      CEvolume: [],
    },
    chart: {
      series: [],
      PEoiChg: ["putOIChange"],
      CEoiChg: ["callOIChange"],
      PEoi: ["putOI"],
      CEoi: ["callOI"],
      PEvolume: ["putVolume"],
      CEvolume: ["callVolume"],
    },
    googleData: [
      ["Strike", "putOI Change", "callOI Change", "Put OI", "Call OI"],
    ],
  };

  filteredStrikes.forEach((strike) => {
    // Calculate Premium
    // If LTP is lesser than actual value it is supposed to be then you are getting that strike price in DISCOUNTED price

    // This is to write the x axis
    // strike.CE
    //   ? totals.chart.series.push(strike.CE.strikePrice)
    //   : totals.chart.series.push(strike.PE.strikePrice);
    strike.CE
      ? totals.apexChart.series.push(strike.CE.strikePrice)
      : totals.apexChart.series.push(strike.PE.strikePrice);

    if (strike.CE) {
      strike.CE.actualValue =
        strike.CE.underlyingValue - strike.CE.strikePrice > 0
          ? strike.CE.underlyingValue - strike.CE.strikePrice
          : 0;
      strike.CE.premium = strike.CE.lastPrice - strike.CE.actualValue;
      strike.CE.premiumPercent =
        (100 * strike.CE.premium) / strike.CE.lastPrice;

      let opt = calculateOIaction({
        priceChange: strike.CE.change,
        oiChange: strike.CE.changeinOpenInterest,
      });

      strike.CE.action = opt.action;
      strike.CE.direction = opt.direction;

      // Calculate Totals
      totals.CE.oi += strike.CE.openInterest;
      totals.CE.oiChange += strike.CE.changeinOpenInterest;
      totals.CE.volume += strike.CE.totalTradedVolume;

      // Data For Graph
      totals.apexChart.CEoiChg.push(strike.CE.changeinOpenInterest);
      totals.apexChart.CEoi.push(strike.CE.openInterest);
      totals.apexChart.CEvolume.push(strike.CE.totalTradedVolume);

      totals.CE.volumeList.push({
        strikePrice: strike.strikePrice,
        volume: strike.CE.totalTradedVolume,
      });
      totals.CE.oiList.push({
        strikePrice: strike.strikePrice,
        oi: strike.CE.openInterest,
      });
      totals.CE.oiChgList.push({
        strikePrice: strike.strikePrice,
        oiChg: strike.CE.changeinOpenInterest,
      });
    } else {
      strike.CE = {};
      strike.CE.actualValue =
        strike.CE.premium =
        strike.CE.premiumPercent =
        strike.CE.changeinOpenInterest =
        strike.CE.openInterest =
        strike.CE.totalTradedVolume =
          0;
    }

    if (strike.PE) {
      strike.PE.actualValue =
        strike.PE.strikePrice - strike.PE.underlyingValue > 0
          ? strike.PE.strikePrice - strike.PE.underlyingValue
          : 0;
      strike.PE.premium = strike.PE.lastPrice - strike.PE.actualValue;
      strike.PE.premiumPercent =
        (100 * strike.PE.premium) / strike.PE.lastPrice;

      let opt = calculateOIaction({
        priceChange: strike.PE.change,
        oiChange: strike.PE.changeinOpenInterest,
      });

      strike.PE.action = opt.action;
      strike.PE.direction = opt.direction;

      totals.PE.oi += strike.PE.openInterest;
      totals.PE.oiChange += strike.PE.changeinOpenInterest;
      totals.PE.volume += strike.PE.totalTradedVolume;

      // Data For Graph
      totals.apexChart.PEoiChg.push(strike.PE.changeinOpenInterest);
      totals.apexChart.PEoi.push(strike.PE.openInterest);
      totals.apexChart.PEvolume.push(strike.PE.totalTradedVolume);

      totals.PE.volumeList.push({
        strikePrice: strike.strikePrice,
        volume: strike.PE.totalTradedVolume,
      });
      totals.PE.oiList.push({
        strikePrice: strike.strikePrice,
        oi: strike.PE.openInterest,
      });
      totals.PE.oiChgList.push({
        strikePrice: strike.strikePrice,
        oiChg: strike.PE.changeinOpenInterest,
      });
    } else {
      strike.PE = {};
      strike.PE.actualValue =
        strike.PE.premium =
        strike.PE.premiumPercent =
        strike.PE.changeinOpenInterest =
        strike.PE.openInterest =
        strike.PE.totalTradedVolume =
          0;
    }

    // Now find the strendth of the strike price
    // S S: Strong Support, S R: Strong Resistance, W S: Support stronger than Resistance, W R : Resistance stronger than Support
    strike.strength = "";
    if (
      strike.PE.changeinOpenInterest - strike.CE.changeinOpenInterest >
      strike.PE.changeinOpenInterest * 0.3
    ) {
      strike.strength = "S S";
    } else if (
      strike.PE.changeinOpenInterest - strike.CE.changeinOpenInterest > 0 &&
      strike.PE.changeinOpenInterest - strike.CE.changeinOpenInterest <
        strike.PE.changeinOpenInterest * 0.3
    ) {
      strike.strength = "W S";
    } else if (
      strike.PE.changeinOpenInterest - strike.CE.changeinOpenInterest <
      -strike.CE.changeinOpenInterest * 0.3
    ) {
      strike.strength = "S R";
    } else if (
      strike.PE.changeinOpenInterest - strike.CE.changeinOpenInterest < 0 &&
      strike.PE.changeinOpenInterest - strike.CE.changeinOpenInterest >
        -strike.CE.changeinOpenInterest * 0.3
    ) {
      strike.strength = "W R";
    }
  });

  // Calculate top 1st and 2nd values
  let mySort = (list, key) => {
    return list.sort((a, b) => {
      return b[key] - a[key];
    });
  };

  totals.OIdifference = totals.PE.oi - totals.CE.oi;
  totals.OIChgdifference = totals.PE.oiChange - totals.CE.oiChange;

  // Now calculate if it is Strong or WEAK towards High strike or Low strike (Top or Bottom)
  function calculateStrength(totals, optionType = "CE") {
    // Sort the list by High to Low
    totals[optionType].volumeList = mySort(
      totals[optionType].volumeList,
      "volume"
    );

    totals[optionType].oiList = mySort(totals[optionType].oiList, "oi");

    // volume is valid from 1 ITM to OTM, any volume higher than 1st ITM is not going to help
    if (optionType == "CE") {
      totals[optionType].volumeList = totals[optionType].volumeList.filter(
        (x) => x.strikePrice >= ATM - INTERVAL
      );
      // totals[optionType].oiList = totals[optionType].oiList.filter(
      //   (x) => x.strikePrice >= ATM - INTERVAL
      // );
    } else {
      totals[optionType].volumeList = totals[optionType].volumeList.filter(
        (x) => x.strikePrice <= ATM + INTERVAL
      );
      // totals[optionType].oiList = totals[optionType].oiList.filter(
      //   (x) => x.strikePrice <= ATM + INTERVAL
      // );
    }

    totals[optionType].oiChgList = mySort(
      totals[optionType].oiChgList,
      "oiChg"
    );

    // First High values
    totals[optionType].highOIStrike = totals[optionType].oiList[0].strikePrice;
    totals[optionType].highVolStrike =
      totals[optionType].volumeList[0].strikePrice;
    totals[optionType].highOIchgStrike =
      totals[optionType].oiChgList[0].strikePrice;
    // Second High values
    totals[optionType].secondHighOIStrike =
      totals[optionType].oiList[1].strikePrice;
    totals[optionType].secondHighVolStrike =
      totals[optionType].volumeList[1].strikePrice;

    // Third High values
    totals[optionType].thirdHighOIStrike =
      totals[optionType].oiList[2].strikePrice;
    totals[optionType].thirdHighVolStrike =
      totals[optionType].volumeList[2].strikePrice;

    totals[optionType].volumeDiffPercentage = (
      (100 * totals[optionType].volumeList[1].volume) /
      totals[optionType].volumeList[0].volume
    ).toFixed(2);

    totals[optionType].oiDiffPercentage = (
      (100 * totals[optionType].oiList[1].oi) /
      totals[optionType].oiList[0].oi
    ).toFixed(2);

    totals[optionType].analysis = "";

    if (totals[optionType].volumeDiffPercentage < 75) {
      totals[optionType].volumeStrength = "STRONG";
      totals[optionType].analysis +=
        "Volume is strong at " + totals[optionType].highVolStrike;
    } else {
      if (
        totals[optionType].secondHighVolStrike >
        totals[optionType].highVolStrike
      ) {
        totals[optionType].volumeStrength = "WTT"; // WEAK Towards Top
        totals[optionType].analysis +=
          "Volume can move high from " +
          totals[optionType].highVolStrike +
          " to " +
          totals[optionType].secondHighVolStrike;
      } else {
        totals[optionType].volumeStrength = "WTB"; // WEAK Towards Bottom
        totals[optionType].analysis +=
          "Volume can drop from " +
          totals[optionType].highVolStrike +
          " to " +
          totals[optionType].secondHighVolStrike;
      }

      totals[optionType].analysis +=
        " (" + totals[optionType].volumeDiffPercentage + "%) ";
    }
    totals[optionType].analysis += ", ";

    if (totals[optionType].oiDiffPercentage < 75) {
      totals[optionType].oiStrength = "STRONG";
      totals[optionType].analysis +=
        "OI is strong at " + totals[optionType].highOIStrike;
    } else {
      if (
        totals[optionType].secondHighOIStrike > totals[optionType].highOIStrike
      ) {
        totals[optionType].oiStrength = "WTT";
        totals[optionType].analysis +=
          "OI can move high from " +
          totals[optionType].highOIStrike +
          " to " +
          totals[optionType].secondHighOIStrike;
      } else {
        totals[optionType].oiStrength = "WTB";
        totals[optionType].analysis +=
          "OI can drop from " +
          totals[optionType].highOIStrike +
          " to " +
          totals[optionType].secondHighOIStrike;
      }

      totals[optionType].analysis +=
        " (" + totals[optionType].oiDiffPercentage + "%) ";
    }
  }

  calculateStrength(totals, "CE");
  calculateStrength(totals, "PE");

  return totals;
} // End of calculateTotals

function getDataForCurrentExpiry(response, symbol, range = 10, expiry = 0) {
  let currentExpiry = response.records.expiryDates[0];
  let expTime = new Date(currentExpiry).getTime();
  let curTime = new Date().getTime();
  if (expTime < curTime) {
    expiry++;
  }
  currentExpiry = response.records.expiryDates[expiry];

  let data = expiry == 0 ? response.filtered.data : response.records.data;
  let fetchTime = response.records.timestamp;

  let spotPrice = response.records.underlyingValue;

  let { ATM, STRIKES, INTERVAL } = getStrikePriceRange(
    symbol,
    spotPrice,
    range
  );

  let filteredStrikes = data.filter(
    (item) =>
      item.expiryDate == currentExpiry && STRIKES.indexOf(item.strikePrice) > -1
  );

  let { CE, PE } = response.filtered;
  let pcrOI = (PE.totOI / CE.totOI).toFixed(2);
  let pcrVolume = (PE.totVol / CE.totVol).toFixed(2);
  let totalOiDiff = PE.totOI - CE.totOI;

  // Calculate totals and high and low of each columns
  if (filteredStrikes.length > 0) {
    let totals = calculateTotals(filteredStrikes, ATM, INTERVAL);

    let strongResistance =
      ATM - totals.CE.highVolStrike == INTERVAL ||
      ATM - totals.CE.highOIStrike == INTERVAL ||
      totals.CE.highOIStrike < 2 * ATM ||
      totals.CE.highVolStrike < totals.CE.highOIStrike
        ? totals.CE.highVolStrike
        : totals.CE.highOIStrike;

    let strongSupport =
      ATM + totals.PE.highVolStrike == INTERVAL ||
      ATM + totals.PE.highOIStrike == INTERVAL ||
      totals.PE.highOIStrike > 2 * ATM ||
      totals.PE.highVolStrike > totals.PE.highOIStrike
        ? totals.PE.highVolStrike
        : totals.PE.highOIStrike;

    let supportStrength = (resistanceStrength = "WEAK");
    // Calculate the Chart of Accuracy based on oiStrength and volumeStrength
    if (
      totals.CE.volumeStrength == "STRONG" &&
      totals.CE.oiStrength == "STRONG"
    ) {
      resistanceStrength =
        totals.CE.highVolStrike == totals.CE.highOIStrike
          ? "SUPER STRONG"
          : "VERY STRONG";
    } else if (
      totals.CE.volumeStrength == "STRONG" ||
      totals.CE.volumeStrength == "WTB" // WEAK towards bottom
    ) {
      resistanceStrength = "STRONG";
    }

    if (
      totals.PE.volumeStrength == "STRONG" &&
      totals.PE.oiStrength == "STRONG"
    ) {
      supportStrength =
        totals.PE.highVolStrike == totals.PE.highOIStrike
          ? "SUPER STRONG"
          : "VERY STRONG";
    } else if (
      totals.PE.volumeStrength == "STRONG" ||
      totals.PE.volumeStrength == "WTT" // WEAK towards top
    ) {
      supportStrength = "STRONG";
    }
    return {
      ATM,
      currentExpiry,
      spotPrice,
      fetchTime,
      totals,
      filteredStrikes,
      currentExpiryOIandVolumeTotal: { CE, PE },
      pcrOI,
      pcrVolume,
      totalOiDiff,
      STRIKES,
      strongResistance,
      strongSupport,
      supportStrength,
      resistanceStrength,
    };
  }
  return {
    ATM,
    currentExpiry,
  };
}

// getDataForCurrentExpiry(data, 'NIFTY');
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

module.exports = { getDataForCurrentExpiry, today };
