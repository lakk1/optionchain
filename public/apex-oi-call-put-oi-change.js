import { store } from "./store.js";
import stockList from "./data.js";

export default {
  props: ["symbol", "time", "range"],
  data() {
    return {
      chart: undefined,
      series: [],
      oiOiCallPutTrend: undefined,
      xAxisCategories: [],
      //   callSum: [],
      //   putSum: [],
      putCallDifference: [],
      spotPrice: [],
      date: undefined,
      lastFetchTime: undefined,
      previousSymbol: undefined,
      previousRange: undefined,
      STRIKES: [],
      updated: false,
      expiryDate: "",
    };
  },
  methods: {
    getRange() {
      let strikes = store.getStrikes(this.symbol);
      let minStrike = strikes[0];
      let maxStrike = strikes[strikes.length - 1];
      return { minStrike, maxStrike };
    },
    getSeries() {
      let seriesData = [
        {
          name: "Put Call Difference",
          data: this.putCallDifference,
        },
        {
          name: "Spot Price",
          data: this.spotPrice,
        },
      ];
      // console.log("Call put trend series: ", seriesData);
      return seriesData;
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      this.expiryDate = store.getExpiryDate();
      let { minStrike, maxStrike } = this.getRange();

      console.log(`Drawing OI CALL PUT OI Change for ${this.symbol}`);

      if (this.oiOiCallPutTrend) {
        let options = {
          series: this.getSeries(),
          chart: {
            background: "#cbe6f8",
            type: "line",
            animations: {
              enabled: false,
            },
            toolbar: {
              show: false,
            },
            zoom: {
              enabled: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          colors: ["#FF0000", "#154881", "darkgreen", "lightgreen"],
          stroke: {
            curve: "straight",
            width: [2, 2],
          },
          title: {
            text: `${this.symbol} OI Change Trend for current expiry, data received on ${this.lastFetchTime}`,
            align: "left",
            style: {
              fontSize: "12px",
              fontWeight: "bold",
              color: "#263238",
            },
          },
          grid: {
            borderColor: "#e7e7e7",
            row: {
              colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
              opacity: 0.5,
            },
          },
          markers: {
            size: 0,
          },
          xaxis: {
            categories: this.xAxisCategories,
            labels: {
              show: false,
              hideOverlappingLabels: true,
              style: {
                fontSize: "10px",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 400,
                cssClass: "apexcharts-xaxis-label",
              },
            },
          },
          yaxis: [
            {
              seriesName: "Put Call Difference",
              show: true,

              axisTicks: {
                show: true,
              },
              axisBorder: {
                show: true,
              },
              title: {
                text: "Put Call Difference",
              },
              labels: {
                formatter: function (value) {
                  return parseInt(value);
                },
              },
            },
            {
              opposite: true,
              seriesName: "Line C",
              axisTicks: {
                show: true,
              },
              axisBorder: {
                show: true,
              },
              title: {
                text: "Spot Price",
              },
              labels: {
                formatter: function (value) {
                  return Number(value).toFixed(2);
                },
              },
              min: minStrike,
              max: maxStrike,
            },
          ],
          legend: {
            position: "bottom",
            horizontalAlign: "right",
            floating: true,
            offsetY: -25,
            offsetX: -5,
          },
        };

        let selector = "#" + symbol + "_oiCallPutOIChangeTrend";

        let elem = document.querySelector(selector);

        elem.innerHTML = ""; // RESET

        this.chart = new ApexCharts(elem, options);

        this.chart.render();
      }
    },
    updateOptions() {
      // console.log("Updating chart series for:", this.symbol);
      // this.chart.updateSeries(this.getSeries());
      this.chart.updateOptions({
        series: this.getSeries(),
        xaxis: {
          categories: this.xAxisCategories,
        },
        yaxis: [
          {
            seriesName: "Put Call Difference",
            show: true,

            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
            },
            title: {
              text: "Put Call Difference",
            },
            labels: {
              formatter: function (value) {
                return parseInt(value);
              },
            },
          },
          {
            opposite: true,
            seriesName: "Line C",
            axisTicks: {
              show: true,
            },
            axisBorder: {
              show: true,
            },
            title: {
              text: "Spot Price",
            },
            labels: {
              formatter: function (value) {
                return Number(value).toFixed(2);
              },
            },
            min: minStrike,
            max: maxStrike,
          },
        ],
      });
    },
    async getOiCallPutTrendData(calledFrom) {
      this.STRIKES = store.getStrikes(this.symbol);

      const response = await axios.post("/nse/getPutCallOiChange/", {
        symbol: this.symbol,
        // date: fetchDate,
        strikePrices: this.STRIKES,
      });

      if (response.data) {
        this.oiOiCallPutTrend = response.data;

        let totalRecords = response.data.records.length;
        if (totalRecords == 0) return;

        let maxFetchTime = response.data.records[totalRecords - 1]._id;

        // Check this in the live - whether it is ingoring all or only duplicates
        if (
          this.previousSymbol == this.symbol &&
          this.lastFetchTime == maxFetchTime &&
          this.previousRange == this.range
        ) {
          console.log(
            "No new records to redraw OIChange Trend for ",
            this.symbol
          );
          return;
        }

        this.lastFetchTime = maxFetchTime;
        this.previousSymbol = this.symbol;
        this.previousRange = this.range;
        store.updateFetchTime(this.symbol, this.lastFetchTime);

        // Generate data for Chart
        let xAxisCategories = [];
        // let callSum = [];
        // let putSum = [];
        let putCallDifference = [];
        let spotPrice = [];

        response.data.records.forEach((e) => {
          xAxisCategories.push(e._id.substring(12, 17));
          //   callSum.push(e.CE_OI_CHANGE_SUM);
          //   putSum.push(e.PE_OI_CHANGE_SUM);
          //   console.log("e.CE_OI_CHANGE_SUM ", e.CE_OI_CHANGE_SUM);
          //   console.log("e.PE_OI_CHANGE_SUM ", e.PE_OI_CHANGE_SUM);
          //   console.log("Diff : ", e.PE_OI_CHANGE_SUM - e.CE_OI_CHANGE_SUM);
          let diff = e.PE_OI_CHANGE_SUM - e.CE_OI_CHANGE_SUM;
          putCallDifference.push(diff);
          spotPrice.push(e.SPOT_PRICE);
        });

        this.xAxisCategories = xAxisCategories;
        // this.callSum = callSum;
        // this.putSum = putSum;
        this.putCallDifference = putCallDifference;
        this.spotPrice = spotPrice;

        this.drawOptionsChart();
        // this.updateOptions();
      } else {
        console.log(
          "Failed to get OI Call Put OI Change Trend for symbol",
          symbol
        );
      }
    },
  },
  beforeUpdate() {
    if (
      this.previousSymbol != this.symbol ||
      this.range != this.previousRange
    ) {
      console.log(
        "Inside OI Call Put OI Change trend before Update - updating prev symbol and strike price"
      );
      this.getOiCallPutTrendData("From Before Update");
    }
  },
  mounted() {
    console.log("OI C P OI Change Trend mounted");

    this.intervalHandler = setInterval(() => {
      this.getOiCallPutTrendData("From SetInterval");
    }, 15000);
    this.getOiCallPutTrendData("From Mounted");
  },
  beforeUnmount() {
    clearInterval(this.intervalHandler);
  },
  updated() {
    console.log(
      "OI Call Put OI Change Trend Updated at ",
      this.time,
      "range:",
      this.range
    );
    this.updated = this.time;
  },
  template: `
  <div class="oiTrendContainer">
    <div :id="symbol + '_oiCallPutOIChangeTrend'" style="width: 640px; height: 400px;"></div>
  </div>
  `,
};
