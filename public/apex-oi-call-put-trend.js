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
    };
  },
  methods: {
    getSeries() {
      let seriesData = [
        {
          name: "Put OI",
          data: this.putSum,
        },
        {
          name: "Call OI",
          data: this.callSum,
        },
      ];
      // console.log("Call put trend series: ", seriesData);
      return seriesData;
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      let fetchDate = this.date || store.getFetchDate();

      console.log(`Drawing OI CALL PUT trend for ${this.symbol}`);

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
            text: `${this.symbol} OI Call Put Trend For current expiry at ${this.lastFetchTime}`,
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

        let selector = "#" + symbol + "_oiCallPutTrend";

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

      const response = await axios.post("/nse/getPutCallOiSum/", {
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
          callSum.push(e.CE_OI_SUM);
          putSum.push(e.PE_OI_SUM);
        });

        this.xAxisCategories = xAxisCategories;
        this.callSum = callSum;
        this.putSum = putSum;

        this.drawOptionsChart();
        // this.updateOptions();
      } else {
        console.log("Failed to get OI Call Put OI Trend for symbol", symbol);
      }
    },
  },
  beforeUpdate() {
    if (
      this.previousSymbol != this.symbol ||
      this.range != this.previousRange
    ) {
      console.log(
        "Inside OI Call put trend before Update - updating prev symbol and strike price"
      );
      this.getOiCallPutTrendData("From Before Update");
    }
  },
  mounted() {
    console.log("OI C P Trend mounted");

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
      "OI Call Put Trend Updated at ",
      this.time,
      "range:",
      this.range
    );
    this.updated = this.time;
  },
  template: `
  <div class="oiSeriesContainer">
    <div :id="symbol + '_oiCallPutTrend'" style="width: 640px; height: 400px;"></div>
    <div class='analysis'>
      <p>
        If <b>CALLS</b> are reducing with Short Covering (SC) and PUTS are increasing with Short Buildup (SB), Market will <span class="UP bold priceGreen">RISE - BULLISH</span> as Big Fishes are entering market with Big Fund.
        <br/>
        If <b>CALLS</b> side Long Buildup (LB) and PUTS side Short Buildup (SB) is happening , Market will <span class="UP bold priceGreen">RISE - BULLISH</span> as Big Fishes are entering market with Big Fund.
      </p>
      <p>
      If <b>PUTS</b> are reducing with Short Covering (SC) and CALLS are increasing with Short Buildup (SB), Market will <span class="DOWN bold priceRed">FALL - BEARISH</span> as Big Fishes are running away without supporting the market.
      <br/>
      If <b>PUTS</b> side Long Buildup (LB) and CALLS side Short Buildup (SB) is happening , Market will <span class="DOWN bold priceRed">FALL - BEARISH</span> as Big Fishes are running away without supporting the market.</p>
    </div>
  </div>
  `,
};
