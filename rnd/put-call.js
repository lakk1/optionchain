import { store } from "../public/store.js";

export default {
  props: ["symbol"],
  data() {
    return {
      store,
    };
  },
  methods: {
    drawOptionsChart() {
      console.log("Updating Chart for : ", this.symbol);

      let chartData = this.store.getChartData(this.symbol);
      if (chartData) {
        let { CEoi, PEoi, CEoiChg, PEoiChg, series, PEvolume, CEvolume } =
          chartData;

        const chart = c3.generate({
          bindto: `#${this.symbol}`,
          data: {
            type: "bar",
            columns: [PEoiChg, CEoiChg, PEoi, CEoi],
            // columns: [PEoiChg, CEoiChg, PEoi, CEoi, PEvolume, CEvolume],
            // groups: [
            //   ["putOIChange", "callOIChange"],
            //   ["putOI", "callOI"],
            // ],
            colors: {
              putOIChange: "red",
              callOIChange: "green",
              putOI: "orange",
              callOI: "greenyellow",
              //   callVolume: "cyan",
              //   putVolume: "brown",
            },
            // color: function (color, d) {
            //     // d will be 'id' when called for legends
            //     return d.id && d.id === 'data3' ? d3.rgb(color).darker(d.value / 150) : color;
            // }
          },
          axis: {
            x: {
              type: "category",
              categories: series,
            },
          },
          grid: {
            y: {
              lines: [{ value: 0 }],
            },
          },
          bar: {
            width: {
              ratio: 0.5,
            },
          },
        });
      } else {
      }
    },
  },
  mounted() {
    console.log("Chart mounted...");
    this.intervalHandler = setInterval(this.drawOptionsChart, 30000); // Call every 15 seconds, Updated function is not getting called
    this.drawOptionsChart();
  },
  beforeUnmount() {
    console.log("Unmounting chart....");
    clearInterval(this.intervalHandler);
  },
  template: `
  <div class="chartLayout">
    <div class="title">Put Call OI Change Trend</div>
    <div :id="symbol"></div>
  </div>
  `,
};
