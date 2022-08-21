import { createApp } from "vue";

import OptionChain from "./option-chain.js"; // Main OI Data with Resistance and Support highlights
import ApexOiChart from "./apex-oi-chart.js"; // To show the column bar charts of OI changes and OI at the top
import ApexOiSeriesChart from "./apex-oi-series-chart.js"; // To show the column line series of the Call Put changes for a Strike price
import ApexOiCallPutTrend from "./apex-oi-call-put-trend.js"; // To show the column line chart for Call and Put change for summation of filtered strike prices
import Timer from "./timer.js"; // To show current time in the top of the page

import TrendAnalyzer from "./trend-analyzer.js"; // To fetch the data stored in FILE for selected symbols and maintain it in store

const app = createApp(TrendAnalyzer);
app.component("OptionChain", OptionChain);
app.component("ApexOiChart", ApexOiChart);
app.component("ApexOiSeriesChart", ApexOiSeriesChart);
app.component("ApexOiCallPutTrend", ApexOiCallPutTrend);
app.component("Timer", Timer);

app.mount("#app");
