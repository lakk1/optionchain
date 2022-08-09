const { TV } = require("./tv.server.controller");

// API server Endpoints
module.exports = function (router) {
  router.post("/tv/processTVsignal", TV.processTVsignal);
};
