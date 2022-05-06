# **Option Chain**

This is the Option Chain analyzer for NIFTY and BANKNIFTY from NSE

Author: Chandre Gowda

Email: chandregowda@gmail.com

#### NSE API URL for **NIFTY**: https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY

#### NSE API URL for **BANKNIFTY**: https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY

### Prerequisite

Install NODE JS and NPM from (version 16 and above): https://nodejs.org/en/download/

### Setup:

Step 1. Open Command prompt in Windows or Terminal in Mac

Step 2. Change directory to the folder where this README.md file is present or where server.js file is present using "cd <folder path>"

Step 3: Install the Express and Axios NPM packages by entering below command

`npm install`

Step 2: Start the application, be in the root directory of this project

`npm start`

NOTE: To start in development mode (nodemon) use below command

`npm run dev`

Step 3: Launch browser and access application with URL : **http://localhost:3000**

**NOTE** : By default Node server will be running at port 3000, to start NODE server in different port set the environment variable PORT to different port number

Example : In Windows start node server execute below command

`set PORT=8080 && npm start`

In Mac

`PORT=8080 && npm start`
