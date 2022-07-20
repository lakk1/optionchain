import { store } from "./store.js";

export default {
  props: ["symbol", "strikePrice", "time"],
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
    };
  },
  methods: {
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
        // {
        //   name: "Put Volume",
        //   data: this.PEoiVolume,
        // },
        // {
        //   name: "Call Volume",
        //   data: this.CEoiVolume,
        // },
      ];
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      let strikePrice = this.strikePrice;
      console.log(
        `Drawing OI Series for ${this.symbol} : ${this.strikePrice} of date: ${this.date}`
      );

      if (this.oiSeriesData) {
        let options = {
          series: this.getSeries(),
          chart: {
            height: 300,
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
            text: `OI Series for ${strikePrice} - ${this.date}`,
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
            position: "top",
            horizontalAlign: "right",
            floating: true,
            offsetY: -25,
            offsetX: -5,
          },
        };

        let selector = "#" + symbol + "_" + strikePrice + "_oiseries_div";

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
    async getOiSeriesData() {
      let fetchDate = this.date || store.getFetchDate();
      console.log(
        `Fetching OI Series for ${this.symbol} : ${this.strikePrice} of date: ${fetchDate}`
      );

      const response = await axios.post("/nse/filteredData/", {
        symbol: this.symbol,
        date: fetchDate,
        strikePrices: this.strikePrice,
      });

      if (response.data) {
        this.oiSeriesData = response.data;

        // Generate data for Chart
        // this.xAxisCategories = response.data.records.map((e) =>
        //   e.timeStamp.substring(12, 17)
        // );
        this.xAxisCategories = [];
        this.CEoiChange = [];
        this.PEoiChange = [];
        this.CEoiVolume = [];
        this.PEoiVolume = [];
        response.data.records.forEach((e) => {
          this.xAxisCategories.push(e.timeStamp.substring(12, 17));
          this.CEoiChange.push(e.CE.changeInOI);
          this.PEoiChange.push(e.PE.changeInOI);
          this.CEoiVolume.push(e.CE.volume);
          this.PEoiVolume.push(e.PE.volume);
        });
        this.drawOptionsChart();

        // this.updateOptions();
      } else {
        console.log("Failed to get OI series for symbol", symbol);
      }
    },
  },
  beforeUpdate() {
    // console.log("OI Series Chart beforeUpdate....");
    // this.getOiSeriesData();
  },
  afterUpdate() {
    // this.updateOptions();
  },
  mounted() {
    console.log("OI Series Chart mounted...");
    this.intervalHandler = setInterval(this.getOiSeriesData, 60000);
    // this.drawOptionsChart();
    this.getOiSeriesData();
    if (!this.date) {
      this.date = store.getFetchDate();
    }
  },
  beforeUnmount() {
    clearInterval(this.intervalHandler);
  },
  template: `
  <table class="columns">
      <tr>
        <td style="width:100%">
          <div :id="symbol + '_' + strikePrice + '_oiseries_div'" style="width: 1000px; height: 300px;"></div>
          <!--
            <pre> {{ oiSeriesData }}</pre>
          -->
        </td>
      </tr>
    </table>
  `,
  // <td><div :id="symbol+'_div'" class="" style="border: 1px solid #ccc"> SOMTHING HERE for {{symbol}}</div></td>
};
