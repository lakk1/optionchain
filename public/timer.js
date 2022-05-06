export default {
  data() {
    return {
      currentTime: undefined,
    };
  },
  mounted() {
    setInterval(
      () =>
        (this.currentTime = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        })),
      1000
    );
  },
  template: `
    <span> {{ currentTime }}</span>
  `,
};
