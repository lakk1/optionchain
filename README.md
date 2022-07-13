# NSE Option Chain analyzer

This is the Option Chain analyzer for NIFTY and BANKNIFTY from NSE

Author: Chandre Gowda

Email: chandregowda@gmail.com

#### NSE API URL for **NIFTY**: https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY

#### NSE API URL for **BANKNIFTY**: https://www.nseindia.com/api/option-chain-indices?symbol=BANKNIFTY

### Prerequisite

Install **NODE JS** and **NPM** from (version 16 and above): https://nodejs.org/en/download/

Install **Mongo DB** Community Edition

Install **Python 3.9** or higher

### How does it Work

This application is using **NSE API** (free for localhost based apps) and saves response in the File under _DATA_ folder and also stores stats in DB (for Put / Call changes graph - TODO)

Configuration of the symbols to fetch data is saved in _symbols.json_, set **{"scan": "yes"}** in each symbol node to fetch data from NSE

### Setup:

Open Command prompt in Windows or Terminal in Mac

**Next Step**: Change directory to the folder where this README.md file is present or where server.js file is present using "cd <folder path>"

**Next Step**: Install the Express and Axios NPM packages by entering below command

`npm install`

#### Install python modules:

pip install pandas
pip install pymongo
pip install scipy
pip install mibian

Run dbSetup.mongodb to create Database 'marketdata' and tables with indexes

**Next Step** : Start the application, be in the root directory of this project

Run optionScanner.py to fetch data in periodic interval from NSE site
`py optionScanner.py`

Start Node Web server to load UI (http://localhost:3000)
`npm start`

**NOTE**: To start in development mode (nodemon) use below command
`npm run dev`

**Next Step**: Launch browser and access application with URL : [CAR TRADING](http://localhost:3000)

---

###Change the default Port###

By default Node server will be running at port 3000, to start NODE server in different port set the environment variable PORT to different port number

**Example** : In Windows start node server execute below command

`set PORT=8080 && npm start`

In Mac

`PORT=8080 && npm start`

[Github Link](https://github.com/chandregowda/optionchain)

**Important NOTE**: If you run this application in Production server, NSE will not respond
