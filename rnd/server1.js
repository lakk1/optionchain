/**
 * This is the main server file for starting NODE / Express server
 * Usage:
 * To run in devevlopment mode: > npm run dev
 * To run in normal mode: > node server.js
 * To run in STUB mode for API response : > npm run stub
 */

const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

// Get the command line arguments for stub data testing
const args = process.argv.slice(2);
const STUBMODE = args[0] == "stub" ? true : false;

const axios = require("axios").default;
axios.defaults.timeout = 10000;

const { getDataForCurrentExpiry } = require("../util");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let cookie;

const url_oc = "https://www.nseindia.com/option-chain";
const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "accept-language": "en,gu;q=0.9,hi;q=0.8",
  "accept-encoding": "gzip, deflate, br",
};
const instance = axios.create({
  baseURL: url_oc,
  headers: headers,
  cookie: cookie ? cookie : "",
});

async function getCookies(instance) {
  try {
    const response = await instance.get(url_oc);
    cookie = response.headers["set-cookie"].join();
    // console.log("COOKIEE: ", cookie);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log("getCookies =========> error.status === 403");
      await getCookies(instance);
    } else {
      console.log("getCookies =========> error", error);
    }
  }
}

(async () => {
  await getCookies(instance);
  setInterval(async () => {
    await getCookies(instance);
  }, 50000);
})();

async function fetchNSEdata(symbol = "NIFTY", range = 10, expiry = 0) {
  let url =
    "https://www.nseindia.com/api/option-chain-indices?symbol=" + symbol;

  // let url = "https://www.nseindia.com/api/option-chain-equities?symbol=AARTIIND";

  console.log("URL: ", url);

  let data = undefined;
  data = require(`./DATA/${symbol}/${symbol}.json`);

  if (data) {
    filteredData = getDataForCurrentExpiry(data, symbol, range, expiry);

    console.log("Returning filtered data", filteredData);
    return filteredData;
  } else {
    try {
      if (cookie) {
        const response = await instance.get(url);
        console.log("AXIOS response received for URL: ", url);
        data = response.data;
        let filteredData = getDataForCurrentExpiry(data, symbol, range, expiry);

        return filteredData;
      } else {
        await getCookies(instance);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("fetchNSEdata =========> error.status === 401");
        if (!cookie) {
          console.log("fetchNSEdata =========> cookie not found");
          await getCookies(instance);
        }
        await fetchNSEdata(symbol, range, expiry);
      } else {
        console.log("fetchNSEdata =========> error", error);
      }
    }
  }
  // console.log("DATA:", data);
}

app.get("/nse/:symbol/:range/:expiry", async (req, res) => {
  let symbol = req.params.symbol || "NIFTY";
  let range = req.params.range || 25;
  let expiry = Number(req.params.expiry) || 0;

  try {
    let data = await fetchNSEdata(symbol, range, expiry);
    console.log("");
    res.send(data);
  } catch (e) {
    res.status(401).send(e);
  }
});

// app.get("/nse/:symbol/:range/:expiry", async (req, res) => {
//   let symbol = req.params.symbol || "NIFTY";
//   let range = req.params.range || 25;
//   let expiry = Number(req.params.expiry) || 0;

//   let url =
//     "https://www.nseindia.com/api/option-chain-indices?symbol=" + symbol;
//   console.log("URL: ", url);

//   let headers = { "X-Requested-With": "XMLHttpRequest" };
//   let options = { url, headers, method: "get" };

//   try {
//     let response = undefined;
//     let data = undefined;

//     if (STUBMODE) {
//       console.log("Running in STUB MODE");
//       data = require(`./${symbol}.json`);

//       if (!data) {
//         console.log("Failed to load ", symbol);
//       }
//     } else {
//       response = await axios(options);
//       console.log("AXIOS response received for URL: ", url);
//       data = response.data;
//     }
//     let filteredData = getDataForCurrentExpiry(data, symbol, range, expiry);

//     res.send(filteredData);
//   } catch (error) {
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       // console.log("AXIOS ERROR: response.data - ", error.response.data);
//       // console.log("AXIOS ERROR: response.headers - ", error.response.headers);
//       // console.log("AXIOS ERROR: response.status - ", error.response.status);
//       console.log("AXIOS ERROR for URL: ", url);
//       console.log("AXIOS ERROR: message - ", error.message);
//     } else if (error.request) {
//       // The request was made but no response was received
//       // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
//       // http.ClientRequest in node.js
//       console.log("AXIOS ERROR: No response received from URL: ", url);
//       console.log("AXIOS ERROR: response.request - ", error.request);
//     } else {
//       // Something happened in setting up the request that triggered an Error
//       console.log("AXIOS ERROR: response.message - ", error.message);
//     }
//     // console.log("AXIOS ERROR: config - ", error.config);

//     res.send({ error: true, message: error.message });
//   }
// });

app.listen(port, () => {
  console.log(`CAR is listening on port ${port}`);
});
