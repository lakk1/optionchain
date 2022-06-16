const axios = require("axios");

let cookie;
let url_oc = "https://www.nseindia.com/option-chain";
let url = "https://www.nseindia.com/api/option-chain-equities?symbol=AARTIIND";
// let url = "https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY";
let headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "accept-language": "en,gu;q=0.9,hi;q=0.8",
  "accept-encoding": "gzip, deflate, br",
  authority: "www.nseindia.com",
};

const instance = axios.create({
  baseURL: url_oc,
  headers: headers,
  cookie: cookie ? cookie : "",
});

const getCookies = async () => {
  try {
    const response = await instance.get(url_oc);
    cookie = response.headers["set-cookie"].join();
    console.log("Cookiee:", cookie);
  } catch (error) {
    if (error.response.status === 403) {
      console.log("error.response: ", error.response);
      console.log("getCookies =========> error.status === 403");
      setTimeout(async () => {
        await getCookies();
      }, 1000);
    } else {
      console.log("getCookies =========> error");
    }
  }
};

const getAPIData = async () => {
  try {
    if (cookie) {
      const response = await instance.get(url);
      console.log("COOKIE:", response.data.records.timestamp);
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(error);
      console.log("getAPIData =========> error.status === 401");
      if (!cookie) {
        console.log("getAPIData =========> cookie not found");
        await getCookies();
      }
      await getAPIData();
    } else {
      console.log("getAPIData =========> error");
    }
  }
};

(async () => {
  setInterval(async () => {
    await getCookies();
  }, 5000);

  setInterval(async () => {
    await getAPIData();
  }, 5000);
})();
