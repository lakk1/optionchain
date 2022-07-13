import { createApp } from "vue";

import OptionChain from "./option-chain.js"; // Main OI Data with Resistance and Support highlights
import ApexChart from "./apex-chart.js"; // To show the column bar charts of OI changes and OI at the top
import Timer from "./timer.js"; // To show current time in the top of the page

import TrendAnalyzer from "./trend-analyzer.js"; // To fetch the data stored in FILE for selected symbols and maintain it in store

const app = createApp(TrendAnalyzer);
app.component("OptionChain", OptionChain);
app.component("ApexChart", ApexChart);
app.component("Timer", Timer);

app.mount("#app");
