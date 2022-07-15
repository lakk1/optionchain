import { store } from "./store.js";
import stockList from "./data.js";

export default {
  props: ["symbol"],
  data() {
    return {
      store,
      multiply: false,
    };
  },
  methods: {
    isDataAvailable() {
      return this.store.data && this.store.data[this.symbol] ? true : false;
    },
    spotPrice() {
      return this.store.data[this.symbol]
        ? this.store.data[this.symbol].spotPrice
        : 0;
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
    lotSize() {
      let symbolDetails = stockList.filter((s) => s.symbol == this.symbol)[0];
      return symbolDetails.lotsize;
    },
    oiMultiplier() {
      return this.multiply ? this.lotSize : 1;
    },
  },
  template: `
      <template v-if="isDataAvailable()">
        <div class="reportHeader">
          <span class="symbol">{{ symbol }} </span> :  <span class="spotprice">{{spotPrice()}} </span>
          <span class="pcr">
            <span :class="{ pcrGreen: store.getOiPCR(symbol) < 0.7, red : store.getOiPCR(symbol) > 1.5 }"> PCR (oi): {{ store.getOiPCR(symbol) }} </span>
            &nbsp;
            PCR (volume): {{ store.getVolumePCR(symbol) }}
            &nbsp;
            Put OI - Call OI : <span :class="{ red: store.getTotalOiDiff(symbol) < 0 }">{{ Number(store.getTotalOiDiff(symbol) * oiMultiplier).toLocaleString() }}</span>
          <span/>
        </span>
          <hr />
          <div class="headerActions">
            <div class="timestamp">
              NSE data valid as on: <span class="red">{{fetchTime()}}</span>
            </div>
            <div class="actions">
                <label for="lotMultiplier">Show OI with Quantity</label>
                <input type="checkbox" id="lotMultiplier" v-model="multiply" />
                Lot size : {{ lotSize }}
            </div>
          </div>
        </div>

        <hr />
          <div class="oichart">
            <apex-chart :symbol="symbol" :time="Date.now()">Place for Apex Chart</apex-chart>
          </div>
        <hr />

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
              <th colspan="9" class="call">CALL</th>
              <th><span>BOTTOM</span></th>
              <th colspan="9" class="put">PUT</th>
            </tr>
            <tr class="tabHeader">
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
            </tr>

            <tr v-for="strikes in store.getStrikesDetails(symbol)" :class="{atm: strikes.strikePrice == getATM(symbol)}">
              <td :class="{itm: strikes.strikePrice < getATM(symbol)}"><span v-if="strikes.CE.greeks" > {{ parseFloat(strikes.CE.greeks.delta).toFixed(3)  }} </span> </td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol)}">{{ parseFloat(strikes.CE.impliedVolatility).toFixed(2)  }}</td>
              <td :class="{ red: strikes.CE.changeinOpenInterest < 0, itm: strikes.strikePrice < getATM(symbol), highOIchgCall: store.getTotals(symbol).CE.highOIchgStrike == strikes.strikePrice }">{{ Number(strikes.CE.changeinOpenInterest * oiMultiplier).toLocaleString() }}</td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol), highOICall: store.getTotals(symbol).CE.highOIStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).CE.secondHighOIStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).CE.thirdHighOIStrike == strikes.strikePrice}">{{ Number(strikes.CE.openInterest * oiMultiplier).toLocaleString() }}</td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol), highVolumeCall: store.getTotals(symbol).CE.highVolStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).CE.secondHighVolStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).CE.thirdHighVolStrike == strikes.strikePrice}">{{ Number(strikes.CE.totalTradedVolume * oiMultiplier).toLocaleString() }}</td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol), priceRed: strikes.CE.change < 0, priceGreen: strikes.CE.change > 0 }">{{ parseFloat(strikes.CE.change).toFixed(2) }}</td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol)}">{{ parseFloat(strikes.CE.premium).toFixed(2) }} <span class="premium">{{parseFloat(strikes.CE.premiumPercent).toFixed(2)}}</span></td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol)}">{{ parseFloat(strikes.CE.actualValue).toFixed(2) }}</td>
              <td :class="{itm: strikes.strikePrice < getATM(symbol), discount: strikes.CE.premium < 0}">{{ parseFloat(strikes.CE.lastPrice).toFixed(2) }}</td>

              <td class="strikePrice">{{ strikes.strikePrice }}</td>

              <td :class="{itm: strikes.strikePrice > getATM(symbol), discount: strikes.PE.premium < 0 }">{{ parseFloat(strikes.PE.lastPrice).toFixed(2) }}</td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol)}">{{ parseFloat(strikes.PE.actualValue).toFixed(2) }}</td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol)}">{{ parseFloat(strikes.PE.premium).toFixed(2) }} <span class="premium"> {{parseFloat(strikes.PE.premiumPercent).toFixed(2)}}</span></td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol), priceRed: strikes.PE.change < 0, priceGreen: strikes.PE.change > 0 }">{{ parseFloat(strikes.PE.change).toFixed(2) }}</td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol), highVolumePut: store.getTotals(symbol).PE.highVolStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).PE.secondHighVolStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).PE.thirdHighVolStrike == strikes.strikePrice}">{{ Number(strikes.PE.totalTradedVolume * oiMultiplier).toLocaleString() }}</td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol), highOIPut: store.getTotals(symbol).PE.highOIStrike == strikes.strikePrice, secondHigh: store.getTotals(symbol).PE.secondHighOIStrike == strikes.strikePrice, thirdHigh: store.getTotals(symbol).PE.thirdHighOIStrike == strikes.strikePrice}">{{ Number(strikes.PE.openInterest * oiMultiplier).toLocaleString() }}</td>
              <td :class="{ red: strikes.PE.changeinOpenInterest < 0, itm: strikes.strikePrice > getATM(symbol), highOIchgPut: store.getTotals(symbol).PE.highOIchgStrike == strikes.strikePrice }">{{ Number(strikes.PE.changeinOpenInterest * oiMultiplier).toLocaleString() }}</td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol)}">{{ parseFloat(strikes.PE.impliedVolatility).toFixed(2)  }}</td>
              <td :class="{itm: strikes.strikePrice > getATM(symbol)}"><span v-if="strikes.CE.greeks" > {{ parseFloat(strikes.PE.greeks.delta).toFixed(3) }} </span> </td>
            </tr>
            <tr class="totals">
              <td colspan=2>&nbsp;</td>
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
              <td colspan=2>&nbsp;</td>
            </tr>
          </table>
        </div>
      </template>
    `,
};
