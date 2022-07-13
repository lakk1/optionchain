import { store } from "../public/store.js";

export default {
  props: ["title"],
  data() {
    return {
      counter: 0,
      store,
    };
  },
  methods: {
    increment() {
      this.counter++;
      this.store.increment();
    },
  },
  template: `<div>
    <button @click="counter++">{{ title }} - {{ counter }}</button>
    STORE Count: {{ store.count }}
    <button @click="store.increment()"> Increment Store </button>
  </div>`,
};
