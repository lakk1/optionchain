import stockList from "./data.js";

export default {
  data() {
    return {
      message: "Hello Vue!",
      stockList,
      fetchedData: "",
      stock: "",
      exchange: "NFO",
      months: [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ],
      expiry: "",
      price: "",
      optionType: "CE",
      selectedSymbols: [],
      stepInterval: 1,
      tradingViewChartID: "2KtTJcpt",
    };
  },
  methods: {
    clear() {
      this.selectedSymbols = [];
    },
    undo() {
      this.selectedSymbols.pop();
      this.selectedSymbols.pop();
    },
    populateStock(sym) {
      // on click of link it populates dropdown and step interval
      this.stock = sym;
      this.updateStepInterval();
      this.price = "";
      // this.$refs.stockPrice.select();
      this.$refs.stockPrice.focus();
    },
    submitData() {
      let filtered = this.stockList.filter((st) => st.symbol == this.stock);
      if (filtered.length > 0) {
        let formatedPrice = Number(this.price).toFixed(1);
        let symbolString = `${this.exchange} ${this.stock} ${this.expiry} ${formatedPrice} ${this.optionType} `;
        let underlyingSymbolString = `NSE ${this.stock}`;
        this.fetchedData = filtered.length ? symbolString : "";
        this.selectedSymbols.push({
          symbol: underlyingSymbolString,
          lotsize: 0,
          steps: 0,
        });
        this.selectedSymbols.push({
          symbol: symbolString,
          lotsize: filtered[0].lotsize,
          steps: filtered[0].steps,
        });
      }
    },
    updateStepInterval(sym) {
      let filtered = this.stockList.filter((st) => st.symbol == this.stock);
      this.stepInterval = filtered.length > 0 ? filtered[0].steps : 1;
    },
  },
  computed: {
    currentMonth() {
      let mon = new Date().getMonth();
      return this.months[mon];
    },
    chartLink() {
      let url = "https://www.tradingview.com/chart/";
      let params = "?interval=5&symbol=NSE:";
      let chartID =
        this.tradingViewChartID.trim() !== ""
          ? this.tradingViewChartID.trim() + "/"
          : "";
      return url + chartID + params;
    },
    investingDaddyLink() {
      // https://ltp.investingdaddy.com/detailed-options-chain.php?symbol=TVSMOTOR
      let url =
        "https://ltp.investingdaddy.com/detailed-options-chain.php?symbol=";
      return url;
    },
  },
  mounted() {
    this.expiry = this.currentMonth;
    // this.submitData();
  },
};
