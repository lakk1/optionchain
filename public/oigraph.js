import { store } from "./store.js";

export default {
  props: ["symbol"],
  data() {
    return {
      store,
    };
  },
  methods: {
    drawOptionsChart() {
      let symbol = this.symbol;
      console.log("Updating Google Chart for : ", symbol);
      //   let chartData = [
      //     ["Year", "putOI Change", "callOI Change", "Put OI", "Call OI"],
      //     ["2014", 1000, 400, 200, 21],
      //     ["2015", 1170, 460, 250, 32],
      //     ["2016", 660, 1120, 300, 66],
      //     ["2017", 1030, 540, 350, 88],
      //   ];

      let chartData = this.store.getGoogleChartData(symbol);
      let ticks = this.store.getChartData(symbol).series;
      console.log("TICKS:");
      console.log(typeof ticks);

      // Draw the bar chart when Charts is loaded.
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        google.charts.load("current", { packages: ["bar"] });
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {
          var data = google.visualization.arrayToDataTable(chartData);

          var options = {
            colors: ["red", "darkgreen", "orange", "lightgreen", "#f6c7b6"],
            title: "Put Call OI Trend",
            subtitle: "Daily Change and Overall OI stats",
            legend: {
              position: "left",
              textStyle: { color: "blue", fontSize: 12 },
            },
            ticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            hAxis: {
              slantedText: true,
              slantedTextAngle: "-45",
              format: "decimal",
              textStyle: {
                color: "black",
              },
              gridlines: {
                color: "red",
                minSpacing: 20,
              },
              textPosition: "in",
            },
            vAxis: {
              format: "decimal",
              slantedText: true,
              slantedTextAngle: "-45",
              gridlines: {
                color: "red",
                minSpacing: 20,
              },
            },
            bar: { groupWidth: "55%" },
            width: 1000,
            height: 300,
          };

          var chart = new google.charts.Bar(
            document.getElementById(symbol + "_barchart_div")
          );

          chart.draw(data, google.charts.Bar.convertOptions(options));
        }
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
  <table class="columns">
      <tr>
        <td><div :id="symbol+'_barchart_div'" style="width: 1000px; height: 300px;"></div></td>
      </tr>
    </table>
  `,
  // <td><div :id="symbol+'_div'" class="" style="border: 1px solid #ccc"> SOMTHING HERE for {{symbol}}</div></td>
};
