import { reactive } from "vue";

export const store = reactive({
  loading: true,
  updatesAt: undefined,
  data: {},
  updateLoading(status = false) {
    this.loading = status;
    this.updatesAt = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  },
  updateResponse(data, symbol) {
    this.data[symbol] = data;
    this.loading = false;
  },
  getStrikes(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].STRIKES : [];
  },
  getStrikesDetails(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].filteredStrikes : [];
  },
  getTotals(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].totals : {};
  },
  getAnalysis(sym = "NIFTY", optionType = "CE") {
    let p = this.data[sym].totals[optionType].analysis;
    return this.data[sym] ? this.data[sym].totals[optionType].analysis : "";
  },
  getFilteredPCR(sym = "NIFTY") {
    return this.data[sym]
      ? Number(
          this.data[sym].totals.PE.oi / this.data[sym].totals.CE.oi
        ).toFixed(2)
      : 0;
  },
  getExpiry(sym = "NIFTY") {
    if (sym == "both") {
      sym = "NIFTY";
    }
    return this.data[sym] ? this.data[sym].currentExpiry : "";
  },
  updateFetchTime(sym = "NIFTY", fetchTime) {
    this.data[sym].fetchTime = fetchTime;
  },
  getFetchTime(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].fetchTime : {};
  },
  getFetchDate(sym = "NIFTY") {
    return this.data[sym] && this.data[sym].fetchTime
      ? this.data[sym].fetchTime.substring(0, 11)
      : "";
  },
  getChartData(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].totals.chart : {};
  },
  getOIChartData(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].totals.apexChart : {};
  },
  getTotalOiDiff(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].totalOiDiff : {};
  },
  getVolumePCR(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].pcrVolume : 0;
  },
  getOiPCR(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].pcrOI : 0;
  },
  getOiTotal(sym = "NIFTY", optionType = "CE") {
    return this.data[sym]
      ? this.data[sym].currentExpiryOIandVolumeTotal[optionType].totOI
      : 0;
  },
  getVolumeTotal(sym = "NIFTY", optionType = "CE") {
    return this.data[sym]
      ? this.data[sym].currentExpiryOIandVolumeTotal[optionType].totVol
      : 0;
  },
  getATM(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].ATM : 0;
  },
});
