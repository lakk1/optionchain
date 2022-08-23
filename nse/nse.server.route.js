const { NSE } = require("./nse.server.controller");

// API server Endpoints
module.exports = function (router) {
  router.get("/nse/optionChain/:symbol/:range/:expiry", NSE.getOptionChain);
  router.get("/nse/optionChainDB/:symbol", NSE.getDBOptionChain);
  router.post("/nse/filteredData/", NSE.getfilteredData);
  router.post("/nse/getPutCallOiSum/", NSE.getPutCallOiSum);
  router.post("/nse/getPutCallOiChange/", NSE.getPutCallOiChange);
  router.post("/nse/getMarketPrice/", NSE.getMarketPrice);
};
