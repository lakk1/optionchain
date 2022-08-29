import { createApp } from "vue";

import OptionChain from "./option-chain.js"; // Main OI Data with Resistance and Support highlights
import ApexOiChart from "./apex-oi-chart.js"; // To show the column bar charts of OI changes and OI at the top
import ApexOiStrikeChart from "./apex-oi-strike-chart.js"; // To show the line series of the Call Put changes for a Strike price
// import ApexOiCallPutTrend from "./apex-oi-call-put-trend.js"; //
import ApexOiCallPutOiChange from "./apex-oi-call-put-oi-change.js"; // To show the line chart for Call and Put difference and Price Movement for summation of filtered strike prices
import ApexPutCallOiChange from "./apex-put-call-oi-change.js"; // To show the line chart for Call and Put difference and Price Movement for summation of filtered strike prices
import Timer from "./timer.js"; // To show current time in the top of the page

import TrendAnalyzer from "./trend-analyzer.js"; // To fetch the data stored in FILE for selected symbols and maintain it in store

const app = createApp(TrendAnalyzer);
app.component("OptionChain", OptionChain);
app.component("ApexOiChart", ApexOiChart);
app.component("ApexOiStrikeChart", ApexOiStrikeChart);
// app.component("ApexOiCallPutTrend", ApexOiCallPutTrend);
app.component("ApexOiCallPutOiChange", ApexOiCallPutOiChange);
app.component("ApexPutCallOiChange", ApexPutCallOiChange);
app.component("Timer", Timer);

app.mount("#app");
