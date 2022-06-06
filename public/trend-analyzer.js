import { store } from "./store.js";

export default {
  data() {
    return {
      store,
      supportedSymbols: ["BANKNIFTY", "NIFTY"],
      symbol: "BANKNIFTY",
      range: 10,
      expiry: 0,
      refreshInterval: 30, // seconds
      display: "both",
    };
  },
  methods: {
    async fetchOptions(sym) {
      let symbol = sym || this.symbol;

      this.store.updateLoading(true);

      const response = await axios.get(
        "/nse/" + symbol + "/" + this.range + "/" + this.expiry
      );

      if (response.data.fetchTime) {
        this.store.updateResponse(response.data, symbol);
      } else {
        console.log("Failed to get data for symbol", symbol);
        this.store.updateLoading();
      }
    },
    refreshData() {
      this.fetchOptions("NIFTY");
      this.fetchOptions("BANKNIFTY");
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
    let fetchData = this.fetchOptions;
    let interval = this.refreshInterval * 1000;

    function refresh() {
      console.log("Refreshing data @ ", Date());
      fetchData("BANKNIFTY");
      fetchData("NIFTY");
    }

    refresh(); // Call once before starting interval

    // Call every 30 seconds to refresh data
    setInterval(refresh, interval);
  },
  computed: {},
};
