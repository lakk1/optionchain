const { NSE } = require("./nse.server.controller");

// API server Endpoints
module.exports = function (router) {
  router.get("/nse/optionChain/:symbol/:range/:expiry", NSE.getOptionChain);
  router.get("/nse/optionChainDB/:symbol", NSE.getDBOptionChain);
  router.post("/nse/filteredData/", NSE.getfilteredData);
};
