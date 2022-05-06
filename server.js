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

const { getDataForCurrentExpiry } = require("./util");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function fetchNSEdata(symbol, range = 10, expiry = 0) {
  let url =
    "https://www.nseindia.com/api/option-chain-indices?symbol=" + symbol;
  console.log("URL: ", url);
  let headers = { "X-Requested-With": "XMLHttpRequest" };
  let options = { url, headers, method: "get" };

  try {
    let response = undefined;
    let data = undefined;

    if (STUBMODE) {
      console.log("Running in STUB MODE");
      data = require(`./${symbol}.json`);

      if (!data) {
        console.log("Failed to load ", symbol);
      }
    } else {
      response = await axios(options); // invoke NSE API

      console.log("AXIOS response received for URL: ", url);
      data = response.data;
    }
    let filteredData = getDataForCurrentExpiry(data, symbol, range, expiry);

    return filteredData;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.log("AXIOS ERROR: response.data - ", error.response.data);
      // console.log("AXIOS ERROR: response.headers - ", error.response.headers);
      // console.log("AXIOS ERROR: response.status - ", error.response.status);
      console.log("AXIOS ERROR for URL: ", url);
      console.log("AXIOS ERROR: message - ", error.message);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log("AXIOS ERROR: No response received from URL: ", url);
      console.log("AXIOS ERROR: response.request - ", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("AXIOS ERROR: response.message - ", error.message);
    }
    // console.log("AXIOS ERROR: config - ", error.config);

    throw Error({ error: true, message: error.message });
  }
}

app.get("/nse/:symbol/:range/:expiry", async (req, res) => {
  let symbol = req.params.symbol || "NIFTY";
  let range = req.params.range || 25;
  let expiry = Number(req.params.expiry) || 0;

  try {
    let data = await fetchNSEdata(symbol, range, expiry);
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
