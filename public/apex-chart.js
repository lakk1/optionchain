import { store } from "./store.js";

export default {
  props: ["symbol"],
  data() {
    return {
      store,
      chart: undefined,
    };
  },
  methods: {
    getSeries() {
      let chartData = this.store.getApexChartData(this.symbol);
      let { CEoi, PEoi, CEoiChg, PEoiChg } = chartData;

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
    updateSeries() {
      console.log("Updating chart series for:", this.symbol);
      this.chart.updateSeries(this.getSeries());
    },
    drawOptionsChart() {
      let symbol = this.symbol;
      console.log("Drawing Apex Chart for : ", symbol);

      let chartData = this.store.getApexChartData(this.symbol);
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
              enabled: true,
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
            categories: series,
          },
        };

        this.chart = new ApexCharts(
          document.querySelector("#" + symbol + "_barchart_div"),
          options
        );

        document.querySelector("#" + symbol + "_barchart_div").innerHTML = "";
        this.chart.render();
      }
    },
  },
  mounted() {
    console.log("Apex Chart mounted...");
    this.intervalHandler = setInterval(this.updateSeries, 30000); // Call every 15 seconds, Updated function is not getting called
    this.drawOptionsChart();
    this.updateSeries();
  },
  beforeUnmount() {
    console.log("Unmounting chart....");
    clearInterval(this.intervalHandler);
  },
  template: ` 
  <table class="columns">
      <tr>
        <td style="width:100%"><div :id="symbol+'_barchart_div'" style="width: 1000px; height: 300px;"></div></td>
      </tr>
    </table>
  `,
  // <td><div :id="symbol+'_div'" class="" style="border: 1px solid #ccc"> SOMTHING HERE for {{symbol}}</div></td>
};
