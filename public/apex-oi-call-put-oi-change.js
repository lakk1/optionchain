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
      callSum: [],
      putSum: [],
      date: undefined,
      lastFetchTime: undefined,
      previousSymbol: undefined,
      previousRange: undefined,
      STRIKES: [],
      updated: false,
      showDetails: true,
    };
  },
  methods: {
    getSeries() {
      let seriesData = [
        {
          name: "Put OI Change",
          data: this.putSum,
        },
        {
          name: "Call OI Change",
          data: this.callSum,
        },
      ];
      // console.log("Call put trend series: ", seriesData);
      return seriesData;
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      let fetchDate = this.date || store.getFetchDate();

      console.log(`Drawing OI CALL PUT OI Change for ${this.symbol}`);

      if (this.oiOiCallPutTrend) {
        let options = {
          series: this.getSeries(),
          chart: {
            // height: 300,
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
          // colors: ["#FF0000", "darkgreen"],
          colors: ["#FF0000", "darkgreen", "#ffa500", "lightgreen"],
          stroke: {
            curve: "straight",
            width: [2, 2],
          },
          title: {
            text: `${this.symbol} OI Put Call OI Change Trend for current expiry at ${this.lastFetchTime}`,
            // text: `${this.symbol} OI Call Put Trend for ${
            //   this.range * 2 + 1
            // } Strikes at ${this.lastFetchTime}`,
            align: "left",
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
          yaxis: {
            title: {
              text: "Open Interest",
            },
            // min: 5,
            // max: 40,
          },
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
            "No new records to redraw OI Call Put Trend for ",
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
        let callSum = [];
        let putSum = [];

        response.data.records.forEach((e) => {
          xAxisCategories.push(e._id.substring(12, 17));
          callSum.push(e.CE_OI_CHANGE_SUM);
          putSum.push(e.PE_OI_CHANGE_SUM);
        });

        this.xAxisCategories = xAxisCategories;
        this.callSum = callSum;
        this.putSum = putSum;

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
    <div class='analysis'>
      <div>
        <input type="checkbox" :id="symbol + '_oiCallPutOIChangeTrend_chkbox'"  class="analysis_chkbox'" @change="showDetails = !showDetails" />
        <label :for="symbol + '_oiCallPutOIChangeTrend_chkbox'"> Show / Hide Information
      </div>
      <div class="details" v-if="showDetails">
        <p>
          As long as Puts are Increasing and Calls are decreasing or not incrasing it will be <span class="UP bold priceGreen">RISE - BULLISH</span>
        </p>
        <p>
          As long as Calls are Increasing and Puts are decreasing or not incrasing it will be <span class="DOWN bold priceRed">FALL - BEARISH</span>
        </p>
        <p>
          If both Calls and Puts are increasing or decreasing - STAY away - wait and watch.
          <br/>It will be tough fight between Bulls and Bears, leading to Sidewise or RANGE bound market.
        </p>
      </div>
    </div>
  </div>
  `,
};
