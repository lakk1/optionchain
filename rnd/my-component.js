import { store } from "./store.js";

export default {
  data() {
    return {
      message: "Welcome to bot",
      count: 0,
      store,
      url: "https://www.nseindia.com/api/option-chain-indices?symbol=",
      obj: {
        nested: { count: 0 },
        arr: ["foo", "bar"],
        profile: {
          name: "Hello",
          age: 20,
          city: "BLR",
        },
      },
    };
  },
  methods: {
    increment() {
      this.count++;
      this.obj.arr.push("bazzzz");
    },
    async fetchOptions(symbol = "NIFTY") {
      console.log("Fetching Options for ", symbol);
      const response = await axios.get("/nse/" + symbol);
      console.log("Got Response");
      this.store.updateResponse(response.data);
    },
  },
  mounted() {
    this.increment();
  },
  computed: {
    newArr() {
      return this.obj.arr.join("-");
    },
  },
  //   template: `<div>{{ message }} <br/> count is {{ count }}</div>`,
};
