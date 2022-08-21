import { store } from "./store.js";

export default {
  data() {
    return {
      store,
      stockList: [],
      symbol: "BANKNIFTY",
      range: 7,
      expiry: 0,
      refreshInterval: 30, // seconds
      display: "BANKNIFTY",
      time: "",
    };
  },
  methods: {
    async fetchOptions(sym) {
      let symbol = sym || this.display;
      console.log("Fetching data for ", this.display);
      this.store.updateLoading(true);

      const response = await axios.get(
        "/nse/optionChain/" + symbol + "/" + this.range + "/" + this.expiry
      );

      if (response.data.fetchTime) {
        this.store.updateResponse(response.data, symbol);
        this.store.updateLoading();
      } else {
        console.log("Failed to get data for symbol", symbol);
        this.store.updateLoading();
      }
    },
    refreshData() {
      if (this.display == "both") {
        this.fetchOptions("NIFTY");
        this.fetchOptions("BANKNIFTY");
      } else {
        console.log("Displaying: ", this.display);
        this.fetchOptions(this.display);
      }
      let title =
        this.display == "both" ? "INDICIES" : this.display.toUpperCase();
      document.title = "OptionChain -  " + title;
    },
    isDataAvailable(sym) {
      return this.store.data && this.store.data[sym] ? true : false;
    },
    spotPrice(sym) {
      let data = this.store.data;
      return data[sym] ? data[sym].spotPrice : 0;
    },
    getData(sym, callOrPut) {
      let data = this.store.data;
      if (data[sym] && data[sym][callOrPut]) {
        return data[sym][callOrPut];
      } else return [];
    },
    async getStockList() {
      let response = await axios.get("/symbols");
      if (response.data) {
        this.stockList = response.data;
      }
    },
  },
  async mounted() {
    let interval = this.refreshInterval * 1000;
    this.refreshData(); // Call once before starting interval
    // Call every 30 seconds to refresh data
    this.intervalHandler = setInterval(this.refreshData, interval);
    this.getStockList();
    this.time = new Date().getTime();
  },
  beforeUnmount() {
    console.log("Unmounting Option Chain analyzer");
    clearInterval(this.intervalHandler);
  },
};
