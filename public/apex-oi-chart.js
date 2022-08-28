import { store } from "./store.js";

export default {
  props: ["symbol", "time", "prefix", "expiryDate", "range"],
  data() {
    return {
      chart: undefined,
      series: [],
      updated: false,
    };
  },
  methods: {
    getSeries() {
      let chartData = store.getOIChartData(this.symbol);
      // console.log("Chart DATA: for", this.symbol);
      // console.log(chartData);

      let { CEoi, PEoi, CEoiChg, PEoiChg, series } = chartData;
      this.series = series;

      return [
        {
          name: "PE OI Change",
          type: "column",
          data: PEoiChg,
        },
        {
          name: "CE OI Change",
          type: "column",
          data: CEoiChg,
        },
        {
          name: "PE OI",
          type: "column",
          data: PEoi,
        },
        {
          name: "CE OI",
          type: "column",
          data: CEoi,
        },
      ];
    },
    updateOptions() {
      // console.log("Updating Bar chart series for:", this.symbol);
      // this.chart.updateSeries(this.getSeries());
      this.chart.updateOptions({
        series: this.getSeries(),
        xaxis: {
          categories: this.series,
        },
      });
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      // console.log("Drawing Bar Chart for : ", symbol);

      let chartData = store.getOIChartData(this.symbol);
      // let ticks = this.store.getChartData(symbol).series;
      if (chartData) {
        let { CEoi, PEoi, CEoiChg, PEoiChg, series, PEvolume, CEvolume } =
          chartData;

        let options = {
          chart: {
            height: 350,
            type: "line",
            stacked: false,
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
          colors: ["#FF0000", "darkgreen", "#ffa500", "lightgreen"],
          series: [
            {
              name: "PE OI Change",
              type: "column",
              data: [],
            },
            {
              name: "CE OI Change",
              type: "column",
              data: [],
            },
            {
              name: "PE OI",
              type: "column",
              data: [],
            },
            {
              name: "CE OI",
              type: "column",
              data: [],
            },
            // {
            //   name: "Line C",
            //   type: "line",
            //   data: [1.4, 2, 2.5, 1.5, 2.5, 2.8, 3.8, 4.6],
            // },
          ],
          stroke: {
            width: [0, 0, 0, 0],
          },
          plotOptions: {
            bar: {
              columnWidth: "60%",
              border: 0,
            },
          },
          dataLabels: {
            enabled: false,
            formatter: function (val) {
              return val + "%";
            },
            offsetY: -20,
            style: {
              fontSize: "12px",
              colors: ["#304758"],
            },
          },
          xaxis: {
            categories: this.series,
          },
          annotations: {
            xaxis: [
              {
                x: store.getATM(this.symbol),
                borderColor: "orange",
                label: {
                  style: {
                    fontSize: "12px",
                    color: "#fff",
                    background: "#00E396",
                  },
                  text: "ATM",
                  orientation: "horizontal",
                },
              },
            ],
          },
        };

        this.chart = new ApexCharts(
          document.querySelector("#" + symbol + "_barchart_div" + this.prefix),
          options
        );

        document.querySelector(
          "#" + symbol + "_barchart_div" + this.prefix
        ).innerHTML = "";
        this.chart.render();
      }
    },
  },
  beforeUpdate() {
    this.updateOptions();
  },
  mounted() {
    // console.log("Bar OI Chart mounted...");
    this.intervalHandler = setInterval(this.updateOptions, 30000); // Updated function is not getting called
    this.drawOptionsChart();
    this.updateOptions();
    // this.$watch("$props", this.updateOptions, { deep: true });
  },
  beforeUnmount() {
    // console.log("Unmounting chart....");
    clearInterval(this.intervalHandler);
  },
  updated() {
    // console.log(
    //   "Bar Chart updated....",
    //   this.symbol,
    //   this.time,
    //   this.expiryDate,
    //   this.range
    // );
    this.updated = this.time;
    this.updateOptions();
  },
  template: `
  <table class="columns">
      <tr>
        <td style="width:100%">
        <hr/>
          <div :id="symbol+'_barchart_div'+prefix" style="width: 1000px; height: 300px;"></div>
        </td>
      </tr>
    </table>
  `,
  // <td><div :id="symbol+'_div'" class="" style="border: 1px solid #ccc"> SOMTHING HERE for {{symbol}}</div></td>
};
