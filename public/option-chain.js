import { store } from "./store.js";
import stockList from "./data.js";

export default {
  props: ["symbol", "display", "range", "time", "expiryDate"],
  data() {
    return {
      store,
      multiply: false,
      showOiSeries: true,
      showOiBars: false,
      showOptionChain: true,
      showOiCallPutTrend: false,
      stockList: undefined,
      lotSize: 0,
      strikeInterval: 0,
      fetchDate: undefined,
    };
  },
  mounted() {
    this.getStockList();
    this.fetchDate = this.store.getFetchDate();
  },
  beforeUpdate() {
    this.getStockList();
    this.fetchDate = this.store.getFetchDate();
  },

  methods: {
    getStockList() {
      let symbolDetails = stockList.filter((s) => s.symbol == this.symbol)[0];
      this.lotSize = symbolDetails.lotsize;
      this.strikeInterval = symbolDetails.steps;
    },
    isDataAvailable() {
      return this.store.data && this.store.data[this.symbol] ? true : false;
    },
    fetchTime(sym) {
      return this.store.data[this.symbol]
        ? this.store.data[this.symbol].fetchTime
        : 0;
    },
    getATM(sym) {
      return this.store.data[this.symbol]
        ? this.store.data[this.symbol].ATM
        : 0;
    },
  },
  computed: {
    oiMultiplier() {
      return this.multiply ? this.lotSize : 1;
    },
  },
  template: `
      <div>
        <template v-if="store.getExpiryDate(symbol) != 0 && isDataAvailable()">
          <div class="reportHeader">
            <span class="symbol">{{ symbol }} </span> :  <span class="spotprice">{{store.getSpotPrice(symbol)}} </span>
            <span class="pcr">
              <span :class="{ pcrGreen: store.getOiPCR(symbol) < 0.7, red : store.getOiPCR(symbol) > 1.5 }"> PCR (oi): {{ store.getOiPCR(symbol) }} </span>
              &nbsp;
              PCR (volume): {{ store.getVolumePCR(symbol) }}
              &nbsp;
              Put OI - Call OI : <span :class="{ red: store.getTotalOiDiff(symbol) < 0 }">{{ Number(store.getTotalOiDiff(symbol) * oiMultiplier).toLocaleString() }}</span>
              &nbsp;
              ATM: {{ getATM(symbol) }}
            <span/>
          </span>
            <hr />
            <div class="headerActions">
              <div class="timestamp">
                NSE data last received as on: <span class="red"> {{fetchTime(symbol)}} </span>
              </div>
              <div class="actions">
                  Display OI:
                  <input type="checkbox" :id="symbol+ '_oiBars'" v-model="showOiBars" @change="!showOiBars && !showOiSeries ? showOiSeries = true: showOiSeries = false"/>
                  <label :for="symbol+ '_oiBars'">Bars</label>
                  &nbsp; | &nbsp;
                  <input type="checkbox" :id="symbol+ '_oiSeries'" v-model="showOiSeries" @change="showOiBars = false" />
                  <label :for="symbol+ '_oiSeries'">Series</label>
                  &nbsp; | &nbsp;
                  <input type="checkbox" :id="symbol+ '_oiChain'" v-model="showOptionChain" />
                  <label :for="symbol+ '_oiChain'">Chain</label>
                  &nbsp; | &nbsp;
                  <input type="checkbox" :id="symbol+ '_oiCPTrend'" v-model="showOiCallPutTrend" />
                  <label :for="symbol+ '_oiCPTrend'">Call Put Trend</label>
                  &nbsp; | &nbsp;
                  <input type="checkbox" :id="symbol+ '_lotMultiplier'" v-model="multiply" />

                  <label :for="symbol+  '_lotMultiplier'">Show by Quantity</label>
                  &nbsp; | &nbsp;
                  Lot size : {{ lotSize }}
              </div>
            </div>
          </div>

          <div class="oiSeries" v-if="showOiCallPutTrend">
              <apex-oi-call-put-oi-change :symbol="symbol" :time="time" :range="range"  :prefix="'_inner'" :expiryDate="store.getExpiryDate()">OI Call Put Trend Line Chart</apex-oi-call-put-oi-change>
              <apex-put-call-oi-change :symbol="symbol" :time="time" :range="range" :expiryDate="store.getExpiryDate()">OI PUT Call Change Chart</apex-put-call-oi-change>
            <!--
            <apex-oi-call-put-trend :symbol="symbol" :time="time" :range="range" :expiryDate="store.getExpiryDate()">OI Call Put Trend Line Chart</apex-oi-call-put-trend>
            -->
          </div>

          <template v-if="showOiBars">
            <div class="oichart">
              <apex-oi-chart :symbol="symbol" :time="time" :range="range" :expiryDate="store.getExpiryDate()">Place for OI Chart</apex-oi-chart>
            </div>
          </template>

          <template v-if="showOiSeries" >
            <div class="oiSeries">
              <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=1 multiplier=3 >OI Series Line Chart</apex-oi-strike-chart>
              <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=2 multiplier=2 >OI Series Line Chart</apex-oi-strike-chart>
              <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=3 multiplier=1 >OI Series Line Chart</apex-oi-strike-chart>
            </div>
            <div class="oiSeries">
              <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=4 multiplier=0 >OI Series Line Chart</apex-oi-strike-chart>
              <div class="oiSeriesHeader">
                <span class="symbol">{{ symbol }} </span> :  <span class="spotprice">{{store.getSpotPrice(symbol)}} </span>
                ATM: {{ getATM(symbol) }}
                OI Change PE - CE : <span :class="{ red: store.getTotals(symbol).OIChgdifference < 0 }">{{ Number(store.getTotals(symbol).OIChgdifference * oiMultiplier).toLocaleString() }}</span>
                PCR (Filtered): <span> {{ Number(store.getFilteredPCR(symbol)) }}</span>
                <apex-oi-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" :prefix="'_inner'" v-if="display != 'both' ">Place for OI Chart</apex-oi-chart>
              </div>
              <apex-oi-call-put-oi-change :symbol="symbol" :time="time" :range="range"  :prefix="'_inner'" :expiryDate="store.getExpiryDate()">OI Call Put Trend Line Chart</apex-oi-call-put-oi-change>

            </div>
            <div class="oiSeries">
                <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=5 multiplier=-1 >OI Series Line Chart</apex-oi-strike-chart>
                <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=6 multiplier=-2 >OI Series Line Chart</apex-oi-strike-chart>
                <apex-oi-strike-chart :symbol="symbol" :time="time" :expiryDate="store.getExpiryDate()" chartID=7 multiplier=-3 >OI Series Line Chart</apex-oi-strike-chart>
            </div>
          </template>

          <template v-if="showOptionChain">
            <div class="stats">
              Total PUT OI: {{ Number(store.getOiTotal(symbol, 'PE')).toLocaleString() }}
              &nbsp;
              Total PUT Volume: {{ Number(store.getVolumeTotal(symbol, 'PE')).toLocaleString() }}
              <br/>
              Total CALL OI: {{ Number(store.getOiTotal(symbol, 'CE')).toLocaleString() }}
              &nbsp;
              Total CALL Volume: {{ Number(store.getVolumeTotal(symbol, 'CE')).toLocaleString() }}
            </div>
            <div class="chainTabContainer">
              <table id="optionAnalyzer" class="report">
                <tr>
                  <th colspan="10" class="call">
                    CALL (Resistance is {{ store.getResistanceStrength(symbol) }} at {{ store.getStrongResistance(symbol) }})
                    <br/>{{ store.getAnalysis(symbol, 'CE') }}
                  </th>
                  <th>
                    <span class="symbol">{{ symbol }} </span> <br/>
                    <span class="spotprice">{{store.getSpotPrice(symbol)}} </span></th>
                  <th colspan="10" class="put">
                    PUT (Support is {{ store.getSupportStrength(symbol) }} at {{ store.getStrongSupport(symbol) }})
                    <br/>{{ store.getAnalysis(symbol, 'PE') }}
                  </th>
                </tr>
                <tr class="tabHeader">
                  <th>Action</th>
                  <th>Delta</th>
                  <th>IV</th>
                  <th>OI Chg</th>
                  <th>OI</th>
                  <th>Volume</th>
                  <th>Price<br/>Change</th>
                  <th>Premium</th>
                  <th>Act Val</th>
                  <th>LTP</th>

                  <th>STRIKE</th>

                  <th>LTP</th>
                  <th>Act Val</th>
                  <th>Premium</th>
                  <th>Price<br/>Change</th>
                  <th>Volume</th>
                  <th>OI</th>
                  <th>OI Chg</th>
                  <th>IV</th>
                  <th>Delta</th>
                  <th>Action</th>
                </tr>

                <tr v-for="strikes in store.getStrikesDetails(symbol)" :class="{atm: strikes.strikePrice == getATM(symbol)}">
                  <template v-if="strikes">
                    <td :class="[strikes.CE.action, strikes.CE.direction]">{{ strikes.CE.action }} </td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol)}"><span v-if="strikes.CE.greeks" > {{ parseFloat(strikes.CE.greeks.delta).toFixed(3)  }} </span> </td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol), red: strikes.CE.impliedVolatility > 25}">{{ parseFloat(strikes.CE.impliedVolatility).toFixed(2)  }}</td>
                    <td :class="{ red: strikes.CE.changeinOpenInterest < 0, itm: strikes.strikePrice < getATM(symbol), highOIchgCall: store.getTotals(symbol).CE.highOIchgStrike == strikes.strikePrice }">{{ Number(strikes.CE.changeinOpenInterest * oiMultiplier).toLocaleString() }}</td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol), highOICall: store.getTotals(symbol).CE.highOIStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).CE.secondHighOIStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).CE.thirdHighOIStrike == strikes.strikePrice}">{{ Number(strikes.CE.openInterest * oiMultiplier).toLocaleString() }}</td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol), highVolumeCall: store.getTotals(symbol).CE.highVolStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).CE.secondHighVolStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).CE.thirdHighVolStrike == strikes.strikePrice}">{{ Number(strikes.CE.totalTradedVolume * oiMultiplier).toLocaleString() }}</td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol), priceRed: strikes.CE.change < 0, priceGreen: strikes.CE.change > 0 }">{{ parseFloat(strikes.CE.change).toFixed(2) }}</td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol)}">{{ parseFloat(strikes.CE.premium).toFixed(2) }} <span class="premium">{{parseFloat(strikes.CE.premiumPercent).toFixed(2)}}</span></td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol)}">{{ parseFloat(strikes.CE.actualValue).toFixed(2) }}</td>
                    <td :class="{itm: strikes.strikePrice < getATM(symbol), discount: strikes.CE.premium < 0}">{{ parseFloat(strikes.CE.lastPrice).toFixed(2) }}</td>

                    <td class="strikePrice" :class="{atmStrike: getATM(symbol) == strikes.strikePrice}">
                      {{ strikes.strikePrice }} {{ strikes.strength }}
                    </td>

                    <td :class="{itm: strikes.strikePrice > getATM(symbol), discount: strikes.PE.premium < 0 }">{{ parseFloat(strikes.PE.lastPrice).toFixed(2) }}</td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol)}">{{ parseFloat(strikes.PE.actualValue).toFixed(2) }}</td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol)}">{{ parseFloat(strikes.PE.premium).toFixed(2) }} <span class="premium"> {{parseFloat(strikes.PE.premiumPercent).toFixed(2)}}</span></td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol), priceRed: strikes.PE.change < 0, priceGreen: strikes.PE.change > 0 }">{{ parseFloat(strikes.PE.change).toFixed(2) }}</td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol), highVolumePut: store.getTotals(symbol).PE.highVolStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).PE.secondHighVolStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).PE.thirdHighVolStrike == strikes.strikePrice}">{{ Number(strikes.PE.totalTradedVolume * oiMultiplier).toLocaleString() }}</td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol), highOIPut: store.getTotals(symbol).PE.highOIStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).PE.secondHighOIStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).PE.thirdHighOIStrike == strikes.strikePrice}">{{ Number(strikes.PE.openInterest * oiMultiplier).toLocaleString() }}</td>
                    <td :class="{ red: strikes.PE.changeinOpenInterest < 0, itm: strikes.strikePrice > getATM(symbol), highOIchgPut: store.getTotals(symbol).PE.highOIchgStrike == strikes.strikePrice }">{{ Number(strikes.PE.changeinOpenInterest * oiMultiplier).toLocaleString() }}</td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol), red: strikes.PE.impliedVolatility > 25}">{{ parseFloat(strikes.PE.impliedVolatility).toFixed(2) }}</td>
                    <td :class="{itm: strikes.strikePrice > getATM(symbol)}"><span v-if="strikes.CE.greeks" > {{ parseFloat(strikes.PE.greeks.delta).toFixed(3) }} </span> </td>
                    <td :class="[strikes.PE.action, strikes.PE.direction]">{{ strikes.PE.action }} </td>
                  </template>

                </tr>
                <tr class="totals">
                  <td colspan=3>&nbsp;</td>
                  <td>&Sigma; OI Chg <hr />
                    <span :class="{ red: store.getTotals(symbol).CE.oiChange < 0 }">{{ Number(store.getTotals(symbol).CE.oiChange * oiMultiplier).toLocaleString() }}</span>
                  </td>
                  <td>&Sigma; CE OI <hr /> {{ Number(store.getTotals(symbol).CE.oi * oiMultiplier).toLocaleString() }}</td>
                  <td>&Sigma; Volume <hr /> {{ Number(store.getTotals(symbol).CE.volume * oiMultiplier).toLocaleString() }} </td>
                  <td colspan=4>&nbsp;</td>
                  <td class="oiDifference">
                  OI Change <br /> PE - CE <hr />
                    <span :class="{ red: store.getTotals(symbol).OIChgdifference < 0 }">{{ Number(store.getTotals(symbol).OIChgdifference * oiMultiplier).toLocaleString() }}</span>
                  </td>
                  <td colspan=4>&nbsp;</td>
                  <td>&Sigma; Volume <hr /> {{ Number(store.getTotals(symbol).PE.volume * oiMultiplier).toLocaleString() }} </td>
                  <td>&Sigma; PE OI <hr /> {{ Number(store.getTotals(symbol).PE.oi * oiMultiplier).toLocaleString() }} </td>
                  <td>&Sigma; OI Chg <hr />
                    <span :class="{ red: store.getTotals(symbol).PE.oiChange < 0 }">{{ Number(store.getTotals(symbol).PE.oiChange * oiMultiplier).toLocaleString() }}</span>
                  </td>
                  <td colspan=3>&nbsp;</td>
                </tr>
              </table>
            </div>
          </template>
        </template>
      </div>
    `,
};
