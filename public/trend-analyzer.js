import { store } from "./store.js";
import stockList from "./data.js";

export default {
  data() {
    return {
      store,
      symbol: "BANKNIFTY",
      range: 10,
      expiry: 0,
      refreshInterval: 30, // seconds
      display: "both",
    };
  },
  methods: {
    async fetchOptions(sym) {
      let symbol = sym || this.display;
      console.log("Fetching data for ", this.display);
      this.store.updateLoading(true);

      const response = await axios.get(
        "/nse/" + symbol + "/" + this.range + "/" + this.expiry
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
    },
    isDataAvailable(sym) {
      return this.store.data && this.store.data[sym] ? true : false;
    },
    spotPrice(sym) {
      let data = this.store.data;
      return data[sym] ? data[sym].spotPrice : 0;
    },
    fetchTime(sym) {
      let data = this.store.data;
      return data[sym] ? data[sym].fetchTime : 0;
    },
    getData(sym, callOrPut) {
      let data = this.store.data;
      if (data[sym] && data[sym][callOrPut]) {
        return data[sym][callOrPut];
      } else return [];
    },
  },
  mounted() {
    let interval = this.refreshInterval * 1000;
    this.refreshData(); // Call once before starting interval

    // Call every 30 seconds to refresh data
    this.intervalHandler = setInterval(this.refreshData, interval);

    this.stockList = stockList;
  },
  beforeUnmount() {
    console.log("Unmounting Option Chain analyzer");
    clearInterval(this.intervalHandler);
  },
  computed: {},
};
