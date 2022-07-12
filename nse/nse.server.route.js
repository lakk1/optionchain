const { NSE } = require("./nse.server.controller");

// API server Endpoints
module.exports = function (router) {
  router.get("/nse/putCallData/:symbol/:date", NSE.getPutCallData);
  router.get("/nse/optionChain/:symbol/:range/:expiry", NSE.fetchData);
};
