import { reactive } from "vue";

export const store = reactive({
  loading: true,
  data: {},
  updateLoading(status = false) {
    this.loading = status;
  },
  updateResponse(data, symbol) {
    this.data[symbol] = data;
    this.loading = false;
  },
  getStrikesDetails(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].filteredStrikes : [];
  },
  getTotals(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].totals : {};
  },
  getExpiry(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].currentExpiry : "";
  },
  getChartData(sym = "NIFTY") {
    return this.data[sym] ? this.data[sym].totals.chart : {};
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
});
