function getStrikePriceRange(symbol = "NIFTY", spotPrice = 10000, range = 10) {
  const INTERVAL = { NIFTY: 50, BANKNIFTY: 100 };
  const strikeInterval = INTERVAL[symbol];

  let ATM = Math.round(spotPrice / strikeInterval) * strikeInterval;

  let strikes = [];
  let ce = [];
  let pe = [];
  for (i = range; i > 0; i--) {
    let otm = ATM + strikeInterval * i;
    let itm = ATM - strikeInterval * i;
    ce.push(otm);
    pe.push(itm);
  }
  console.log(
    "Strikes for range:",
    range,
    " symbol: ",
    symbol,
    " at Strike price:",
    spotPrice
  );

  console.log([...pe, ATM, ...ce]);
}

getStrikePriceRange();
