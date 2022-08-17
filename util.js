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
  return { ATM, STRIKES: [...pe, ATM, ...ce] };
}

function calculateOIaction({ oiChange, priceChange } = options) {
  if (priceChange > 0 && oiChange > 0) return { action: "LB", direction: "UP" };
  if (priceChange > 0 && oiChange < 0) return { action: "SC", direction: "UP" };
  if (priceChange < 0 && oiChange < 0)
    return { action: "LU", direction: "DOWN" };
  if (priceChange < 0 && oiChange > 0)
    return { action: "SB", direction: "DOWN" };
  return "";
}

function calculateTotals(filteredStrikes) {
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
      totals.chart.CEoiChg.push(strike.CE.changeinOpenInterest);
      totals.chart.CEoi.push(strike.CE.openInterest);
      totals.chart.CEvolume.push(strike.CE.totalTradedVolume);
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
      totals.chart.PEoiChg.push(strike.PE.changeinOpenInterest);
      totals.chart.PEoi.push(strike.PE.openInterest);
      totals.chart.PEvolume.push(strike.PE.totalTradedVolume);

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

    let gc_data = [
      strike.CE.strikePrice,
      strike.PE.changeinOpenInterest,
      strike.CE.changeinOpenInterest,
      strike.PE.openInterest,
      strike.CE.openInterest,
    ];
    totals.googleData.push(gc_data);
  });

  // Calculate top 1st and 2nd values
  let mySort = (list, key) => {
    return list.sort((a, b) => {
      return b[key] - a[key];
    });
  };
  // Sort the list by High to Low
  totals.CE.volumeList = mySort(totals.CE.volumeList, "volume");
  totals.CE.oiList = mySort(totals.CE.oiList, "oi");
  totals.CE.oiChgList = mySort(totals.CE.oiChgList, "oiChg");

  totals.PE.volumeList = mySort(totals.PE.volumeList, "volume");
  totals.PE.oiList = mySort(totals.PE.oiList, "oi");
  totals.PE.oiChgList = mySort(totals.PE.oiChgList, "oiChg");

  // First High values
  totals.CE.highOIStrike = totals.CE.oiList[0].strikePrice;
  totals.CE.highVolStrike = totals.CE.volumeList[0].strikePrice;
  totals.CE.highOIchgStrike = totals.CE.oiChgList[0].strikePrice;

  totals.PE.highOIStrike = totals.PE.oiList[0].strikePrice;
  totals.PE.highVolStrike = totals.PE.volumeList[0].strikePrice;
  totals.PE.highOIchgStrike = totals.PE.oiChgList[0].strikePrice;

  // Second High values
  totals.CE.secondHighOIStrike = totals.CE.oiList[1].strikePrice;
  totals.CE.secondHighVolStrike = totals.CE.volumeList[1].strikePrice;

  totals.PE.secondHighOIStrike = totals.PE.oiList[1].strikePrice;
  totals.PE.secondHighVolStrike = totals.PE.volumeList[1].strikePrice;

  // Third High values
  totals.CE.thirdHighOIStrike = totals.CE.oiList[2].strikePrice;
  totals.CE.thirdHighVolStrike = totals.CE.volumeList[2].strikePrice;

  totals.PE.thirdHighOIStrike = totals.PE.oiList[2].strikePrice;
  totals.PE.thirdHighVolStrike = totals.PE.volumeList[2].strikePrice;

  totals.OIdifference = totals.PE.oi - totals.CE.oi;
  totals.OIChgdifference = totals.PE.oiChange - totals.CE.oiChange;

  return totals;
}

function getDataForCurrentExpiry(response, symbol, range = 10, expiry = 0) {
  let currentExpiry = response.records.expiryDates[expiry];

  let data = expiry == 0 ? response.filtered.data : response.records.data;
  let fetchTime = response.records.timestamp;

  let spotPrice = response.records.underlyingValue;

  let { ATM, STRIKES } = getStrikePriceRange(symbol, spotPrice, range);

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
    let totals = calculateTotals(filteredStrikes);

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
