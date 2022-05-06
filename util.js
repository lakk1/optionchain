const fs = require("fs");
const path = require("path");

const config = { collectStats: true };

(function createOIstatsFolder() {
  let dirName = path.join(__dirname, "OISTATS");
  fs.mkdir(dirName, { recursive: true }, (err) => {
    if (err) {
      throw err;
      exit;
    } else {
      console.log("Created Directory", dirName);
    }
  });
})();

function storeOIdiffernece(fetchTime, symbol, OIChgdifference, expiry) {
  let dirName = path.join(__dirname, "OISTATS");
  let fileDate = fetchTime.replace(/\s.*/, "");

  let baseName = symbol;
  let fileName = path.join(dirName, `${baseName}_${fileDate}.json`);

  let content = { fetchTime, OIChgdifference, expiry };
  fs.writeFileSync(fileName, JSON.stringify(content) + ",\n", {
    flag: "a",
  });
}

function getStrikePriceRange(symbol = "NIFTY", spotPrice = 10000, range = 10) {
  const INTERVAL = { NIFTY: 50, BANKNIFTY: 100 };
  const strikeInterval = INTERVAL[symbol];

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
    chart: {
      PEoiChg: ["putOIChange"],
      CEoiChg: ["callOIChange"],
      series: [],
      PEoi: ["putOI"],
      CEoi: ["callOI"],
      PEvolume: ["putVolume"],
      CEvolume: ["callVolume"],
    },
  };

  filteredStrikes.forEach((strike) => {
    // Calculate Premium
    // If LTP is lesser than actual value it is supposed to be then you are getting that strike price in DISCOUNTED price

    strike.CE.actualValue =
      strike.CE.underlyingValue - strike.CE.strikePrice > 0
        ? strike.CE.underlyingValue - strike.CE.strikePrice
        : 0;
    strike.CE.premium = strike.CE.lastPrice - strike.CE.actualValue;
    strike.CE.premiumPercent = (100 * strike.CE.premium) / strike.CE.lastPrice;

    strike.PE.actualValue =
      strike.PE.strikePrice - strike.PE.underlyingValue > 0
        ? strike.PE.strikePrice - strike.PE.underlyingValue
        : 0;
    strike.PE.premium = strike.PE.lastPrice - strike.PE.actualValue;
    strike.PE.premiumPercent = (100 * strike.PE.premium) / strike.PE.lastPrice;

    // Calculate Totals
    totals.CE.oi += strike.CE.openInterest;
    totals.CE.oiChange += strike.CE.changeinOpenInterest;
    totals.CE.volume += strike.CE.totalTradedVolume;

    totals.PE.oi += strike.PE.openInterest;
    totals.PE.oiChange += strike.PE.changeinOpenInterest;
    totals.PE.volume += strike.PE.totalTradedVolume;

    // Data For Graph
    totals.chart.PEoiChg.push(strike.PE.changeinOpenInterest);
    totals.chart.CEoiChg.push(strike.CE.changeinOpenInterest);
    totals.chart.PEoi.push(strike.PE.openInterest);
    totals.chart.PEvolume.push(strike.PE.totalTradedVolume);
    totals.chart.CEoi.push(strike.CE.openInterest);
    totals.chart.series.push(strike.CE.strikePrice);
    totals.chart.CEvolume.push(strike.CE.totalTradedVolume);

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

    // Store the OIDifference with timestamp for future use
    if (config.collectStats == true) {
      storeOIdiffernece(
        fetchTime,
        symbol,
        totals.OIChgdifference,
        currentExpiry,
        pcrVolume,
        pcrOI
      );
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
    };
  }
  return {
    ATM,
    currentExpiry,
  };
}

// getDataForCurrentExpiry(data, 'NIFTY');

module.exports = { getDataForCurrentExpiry };
