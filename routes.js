module.exports = function (router) {
  require("./nse/nse.server.route")(router);
  require("./tv/tv.server.route")(router);
};
