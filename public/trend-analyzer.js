import { store } from "./store.js";

export default {
  data() {
    return {
      store,
      stockList: [],
      symbol: "BANKNIFTY",
      range: 7,
      expiry: 0,
      expiryDate: "",
      expiryDates: "",
      refreshInterval: 30, // seconds
      display: "NIFTY",
      time: "",
      showDetails: true,
    };
  },
  methods: {
    async getExpiryDates(sym) {
      let symbol = sym || this.display;
      const response = await axios.get("/nse/getExpiryDates/" + symbol);
      if (response.data) {
        // console.log("Expiry date for ", symbol, response.data);
        this.store.updateExpiryDates(response.data, symbol);
        try {
          this.expiryDates = response.data;
          // if (!this.expiryDate) {
          //   this.expiryDate = this.expiryDates[0];
          // }
          return response.data;
        } catch (e) {
          console.log("Error parsing Expiry Dates");
        }
      }
      return [];
    },

    async fetchOptionChainDetails(sym) {
      let symbol = sym || this.display;
      // console.log("Fetching data for ", symbol);
      this.store.updateLoading(true);
      let expDates = "";
      if (!this.expiryDate) {
        expDates = await this.getExpiryDates(symbol);
        this.expiryDate = expDates[0];
      }
      const response = await axios.get(
        "/nse/optionChain/" + symbol + "/" + this.range + "/" + this.expiryDate
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
        this.fetchOptionChainDetails("NIFTY");
        this.fetchOptionChainDetails("BANKNIFTY");
      } else {
        console.log("Displaying: ", this.display);
        this.fetchOptionChainDetails(this.display);
        if (!this.store.getExpiryDates(this.display))
          this.getExpiryDates(this.display);

        this.store.updateExpiry(this.expiryDate);
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
    this.getExpiryDates("NIFTY");
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
