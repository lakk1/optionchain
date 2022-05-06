import { createApp } from "vue";

import OptionChain from "./option-chain.js";
import PutCallTrend from "./put-call.js";
import Timer from "./timer.js";

import TrendAnalyzer from "./trend-analyzer.js";

const app = createApp(TrendAnalyzer);
app.component("OptionChain", OptionChain);
app.component("PutCallTrend", PutCallTrend);
app.component("Timer", Timer);

app.mount("#app");
