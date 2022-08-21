import { store } from "./store.js";
import stockList from "./data.js";

export default {
  props: [
    "symbol",
    "strikePrice",
    "time",
    "chartID",
    "strikeInterval",
    "multiplier",
  ],
  data() {
    return {
      chart: undefined,
      series: [],
      oiSeriesData: undefined,
      xAxisCategories: [],
      CEoiChange: [],
      PEoiChange: [],
      CEoiVolume: [],
      PEoiVolume: [],
      date: undefined,
      lastFetchTime: undefined,
      previousStrike: undefined,
      previousSymbol: undefined,
      seriesStrikePrice: undefined,
      STRIKES: [],
      interval: 0,
      updated: false,
    };
  },
  methods: {
    getStrikeInterval() {
      let symbolDetails = stockList.filter((s) => s.symbol == this.symbol)[0];
      return symbolDetails.steps;
    },
    getSeries() {
      return [
        {
          name: "Put Change",
          data: this.PEoiChange,
        },
        {
          name: "Call Change",
          data: this.CEoiChange,
        },
      ];
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      let fetchDate = this.date || store.getFetchDate();

      console.log(
        `Drawing OI Series for ${this.symbol} : ${this.seriesStrikePrice} of date: ${fetchDate}`
      );

      if (this.oiSeriesData) {
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
            text: `${this.symbol} OI Change ${this.seriesStrikePrice} ${this.lastFetchTime}`,
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

        let selector =
          "#" + symbol + "_" + this.seriesStrikePrice + "_oiseries_div";

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
    async getOiSeriesData(calledFrom) {
      let fetchDate = this.date || store.getFetchDate();
      this.STRIKES = store.getStrikes(this.symbol);

      if (this.strikeInterval == 0) {
        console.log("Updating interval...");
        let interval = this.getStrikeInterval();
        this.seriesStrikePrice = this.strikePrice + interval * this.multiplier;
      }

      // console.log(
      //   `${calledFrom} ===== Fetching OI Series for ${this.symbol} : ${this.seriesStrikePrice} of date: ${fetchDate}`
      // );

      const response = await axios.post("/nse/filteredData/", {
        symbol: this.symbol,
        date: fetchDate,
        strikePrices: this.seriesStrikePrice,
      });

      if (response.data) {
        this.oiSeriesData = response.data;

        let totalRecords = response.data.records.length;
        if (totalRecords == 0) return;

        let maxFetchTime = response.data.records[totalRecords - 1].timeStamp;

        // Check this in the live - whether it is ingoring all or only duplicates
        if (
          this.lastFetchTime == maxFetchTime &&
          this.previousStrike == this.seriesStrikePrice
        ) {
          console.log("No new records to redraw OI Series for ", this.symbol);
          return;
        }

        this.lastFetchTime = maxFetchTime;
        this.previousStrike = this.seriesStrikePrice;
        this.previousSymbol = this.symbol;
        store.updateFetchTime(this.symbol, this.lastFetchTime);

        // Generate data for Chart
        let xAxisCategories = [];
        let CEoiChange = [];
        let PEoiChange = [];
        let CEoiVolume = [];
        let PEoiVolume = [];
        response.data.records.forEach((e) => {
          xAxisCategories.push(e.timeStamp.substring(12, 17));
          CEoiChange.push(e.CE.changeInOI);
          PEoiChange.push(e.PE.changeInOI);
          CEoiVolume.push(e.CE.volume);
          PEoiVolume.push(e.PE.volume);
        });

        this.xAxisCategories = xAxisCategories;
        this.CEoiChange = CEoiChange;
        this.PEoiChange = PEoiChange;
        this.CEoiVolume = CEoiVolume;
        this.PEoiVolume = PEoiVolume;

        this.drawOptionsChart();

        // this.updateOptions();
      } else {
        console.log("Failed to get OI series for symbol", symbol);
      }
    },
  },
  beforeUpdate() {
    // console.log("STRIKES: ", store.getStrikes(this.symbol));
    // console.log(
    //   this.chartID,
    //   "------------ OI SERIES before Update: ",
    //   this.symbol,
    //   this.strikePrice,
    //   this.seriesStrikePrice
    // );

    if (this.previousSymbol != this.symbol) {
      // console.log(        "Inside before Update - updating prev symbol and strike price"      );
      this.previousSymbol = this.symbol;
      this.seriesStrikePrice = this.strikePrice;
      this.getOiSeriesData("From Before Update");
    }
  },
  created() {
    // console.log(
    //   this.chartID,
    //   "OI SERIES CREATED: ",
    //   this.symbol,
    //   this.strikePrice,
    //   " Interval: ",
    //   this.strikeInterval
    // );
  },
  mounted() {
    if (this.seriesStrikePrice != this.strikePrice) {
      this.seriesStrikePrice = this.strikePrice;
      this.STRIKES = store.getStrikes(this.symbol);
      if (!this.date) {
        this.date = store.getFetchDate();
      }
    }
    this.intervalHandler = setInterval(() => {
      this.getOiSeriesData("From SetInterval");
    }, 15000);
  },
  beforeUnmount() {
    clearInterval(this.intervalHandler);
  },
  updated() {
    console.log("OI Series Updated at ", this.time);
    this.updated = this.time;
    this.getOiSeriesData("From SetInterval");
  },
  template: `
  <div class="oiSeriesContainer">
    <div>
      Strike Price
      <select v-model="seriesStrikePrice" @change="getOiSeriesData('On DropDown Change')">
        <template v-for="s in STRIKES">
            <option :value="s">
              {{s}}
            </option>
        </template></select>
    </div>
    <div :id="symbol + '_' + seriesStrikePrice + '_oiseries_div'" style="width: 640px; height: 400px;"></div>
  </div>
  `,
  // <td><div :id="symbol+'_div'" class="" style="border: 1px solid #ccc"> SOMTHING HERE for {{symbol}}</div></td>
};
