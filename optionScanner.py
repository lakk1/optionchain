import logging
import os
import json
import requests
import threading
import time
import datetime
import traceback
import subprocess
from marketData import insertOptionChain as storeOptionChain, calculateGreeks

DB_ENABLED = True
SLEEP_INTERVAL = 60 # seconds
SOURCE_FILE = "symbols.json"
# SOURCE_FILE = "sample.json"
LOOP = 1

"""
FUNCTION: createDirectory STARTED
"""
def createDirectory(sym, day=''):
    logging.debug("Checking Dir: %s", sym)

    dir = os.path.join("DATA", sym, day)
    try:
        if not os.path.exists(dir):
            logging.debug("Creating new folder: %s", sym)
            os.makedirs(dir)
    except:
        logging.critical("ERROR: Failed to create directory: %s", dir)
    return dir
"""
END OF createDirectory
"""


"""
FUNCTION: thread_function STARTED
"""
def thread_function(symbol):
    logging.info("Thread %s: starting", symbol)

    # for i in range(LOOP): # Call LOOP times
    while True:
        now = datetime.datetime.now().time()

        if now > datetime.time(15, 32, 59, 999999):
            break
        elif now > datetime.time(9, 5, 0, 999999):
            fetchData(symbol)
            time.sleep(SLEEP_INTERVAL)
        else:
            time.sleep(180)

    logging.info("Thread %s: finishing", symbol)
"""
END OF thread_function
"""


"""
FUNCTION: fetchData STARTED
"""
def fetchData(symbol):
    # url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
    # url = "https://www.nseindia.com/api/option-chain-equities?symbol=SBIN"

    logging.info("INFO: Requested data for: %s", symbol)

    try:
        cmd = "py ./scanner.py "+  symbol
        filename = subprocess.getoutput(cmd)

        if(len(filename) > 0 and 'Traceback' not in filename):
            logging.info("INFO: Got response for: %s  FILE: %s", symbol, filename)

            f = open(filename, "r")
            jsonResponse = json.loads(f.read())

            if jsonResponse and jsonResponse["records"]:
                nextExpiry = jsonResponse["records"]["expiryDates"][1]
                futureExpiry = jsonResponse["records"]["expiryDates"][2]
                timeStampStr = jsonResponse["records"]["timestamp"]
                responseDate = timeStampStr.split(' ')[0]
                responseTime = timeStampStr.split(' ')[1].replace(':', '_')
                timeStamp = datetime.datetime.strptime(timeStampStr, '%d-%b-%Y %H:%M:%S')
                filteredData = jsonResponse["filtered"]

                dir = createDirectory(symbol, responseDate)
                filename = os.path.join(dir, symbol + '_' + responseDate + '_' + responseTime +".json")
                if os.path.exists(filename):
                    logging.info("INFO: --------- File "+ filename +" already exists")
                else:
                    with open(filename, 'w') as f:
                        f.write(json.dumps(filteredData)) # write only current expired data
                        if DB_ENABLED:
                            storeOptionChain(filteredData, timeStampStr)

                    dir = os.path.join("DATA", symbol)
                    filename = os.path.join(dir, symbol + ".json")
                    jsonResponse["filtered"] = appendGreeks(filteredData, timeStamp)
                    jsonResponse["records"] = appendGreeks(jsonResponse["records"], timeStamp, nextExpiry)
                    jsonResponse["records"] = appendGreeks(jsonResponse["records"], timeStamp, futureExpiry)
                    with open(filename, 'w') as f:
                        f.write(json.dumps(jsonResponse, indent=1))
            else:
                logging.error("ERROR: --------- Records not found " + symbol)
                logging.error(filename)
        else:
            if ('TimeoutError' in filename):
                logging.error("ERROR: --------- TIMEOUT - Failed to fetch data for:"+ symbol)
            else:
                logging.error("ERROR: --------- Failed to fetch data for:"+ symbol)
                logging.error(filename)
    except Exception:
        logging.warning("EXCEPTION: --------- Failed to fetch data for:" + symbol)
        traceback.print_exc()
"""
END OF fechData
"""

"""
FUNCTION: appendGreeks STARTED
"""
def appendGreeks(data, timeStamp, nextExpiry=None):
    for record in data['data']:
        shouldCalculate = False if nextExpiry and record['expiryDate'] != nextExpiry else True
        if shouldCalculate:
            if record.get('CE'):
                record['CE']['greeks'] = calculateGreeks(record['CE']['underlyingValue'], record['CE']['strikePrice'], record['CE']['expiryDate'], 'CE', record['CE']['impliedVolatility'], timeStamp)
            if record.get('PE'):
                record['PE']['greeks'] = calculateGreeks(record['PE']['underlyingValue'], record['PE']['strikePrice'], record['PE']['expiryDate'], 'PE', record['PE']['impliedVolatility'], timeStamp)
    return data
"""
END OF appendGreeks
"""


"""
FUNCTION: main STARTED
"""
def main():
    logging.info("Main : Reading Symbols")
    f = open(SOURCE_FILE, "r")
    data = json.loads(f.read())

    for sym in data:
        symbol = sym['symbol']
        if 'scan' in sym and sym['scan'] == 'yes':
            fetchData(symbol)
            x = threading.Thread(target=thread_function, args=(symbol,))
            time.sleep(2)
            x.start()
"""
END OF main
"""

# If this is MAIN thread, then call function: main()
if __name__ == "__main__":
    format = "%(asctime)s: %(message)s"
    logging.basicConfig(format=format, level=logging.INFO,
                        datefmt="%H:%M:%S")
    main()

exit()