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

      // Load Charts and the corechart and barchart packages.
      google.charts.load("current", { packages: ["corechart"] });

      // Draw the pie chart and bar chart when Charts is loaded.
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        var data = new google.visualization.DataTable();
        data.addColumn("string", "Topping");
        data.addColumn("number", "Slices");
        data.addRows([
          ["Mushrooms", 3],
          ["Onions", 1],
          ["Olives", 1],
          ["Zucchini", 1],
          ["Pepperoni", 2],
        ]);

        var piechart_options = {
          title: "Pie Chart: How Much Pizza I Ate Last Night",
          width: 400,
          height: 300,
        };
        var piechart = new google.visualization.PieChart(
          document.getElementById(symbol + "_piechart_div")
        );
        piechart.draw(data, piechart_options);

        var barchart_options = {
          title: "Barchart: How Much Pizza I Ate Last Night",
          width: 400,
          height: 300,
          legend: "none",
        };
        var barchart = new google.visualization.BarChart(
          document.getElementById(symbol + "_barchart_div")
        );
        barchart.draw(data, barchart_options);
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
        <td><div :id="symbol+'_piechart_div'" class="" style="border: 1px solid #ccc"></div></td>
        <td><div :id="symbol+'_barchart_div'" class="" style="border: 1px solid #ccc"></div></td>
      </tr>
    </table>
  `,
  // <td><div :id="symbol+'_div'" class="" style="border: 1px solid #ccc"> SOMTHING HERE for {{symbol}}</div></td>
};
