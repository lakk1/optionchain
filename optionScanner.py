import logging
import os
import json
import requests
import threading
import time
import datetime
import traceback
import subprocess

SLEEP_INTERVAL = 90 # seconds
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

    try:
        cmd = "py ./scanner.py "+  symbol
        filename = subprocess.getoutput(cmd)
        
        if(len(filename) > 0 and 'Traceback' not in filename):
            logging.info("Got response for: %s  FILE: %s", symbol, filename)

            f = open(filename, "r")
            jsonResponse = json.loads(f.read())

            if jsonResponse and jsonResponse["records"]:
                timestamp = jsonResponse["records"]["timestamp"]
                responseDate = timestamp.split(' ')[0]
                responseTime = timestamp.split(' ')[1].replace(':', '_')

                dir = createDirectory(symbol, responseDate)
                filename = os.path.join(dir, symbol + '_' + responseTime +".json")
                if os.path.exists(filename):
                    logging.info("File "+ filename +" already exists")
                else:
                    with open(filename, 'w') as f:
                        f.write(json.dumps(jsonResponse))

                    dir = os.path.join("DATA", symbol)
                    filename = os.path.join(dir, symbol + ".json")
                    with open(filename, 'w') as f:
                        f.write(json.dumps(jsonResponse, indent=1))
            else:
                logging.error("ERROR: Fetching data for " + symbol)
        else:
            print("Failed to fetch data for:", symbol)
    except Exception:
        traceback.print_exc()
        logging.warning("Failed to fetch data for:" + symbol)
"""
END OF fechData
"""

async def fetchLoop(symbol):
    while True:
        logging.info("Fetching data for %s", symbol)
        fetchData(symbol)
        time.sleep(SLEEP_INTERVAL)

"""
FUNCTION: main STARTED
"""
def main():

    logging.info("Main : Opening Symbols")
    f = open(SOURCE_FILE, "r")
    data = json.loads(f.read())

    for sym in data:
        symbol = sym['symbol']
        fetchData(symbol)
        # cmd = "py ./scanner.py "+  symbol
        # result = subprocess.getoutput(cmd)

        # print ("GOT result for ", symbol)
        # print ("GOT result:", result)
        # fetchLoop(sym['symbol'])

        x = threading.Thread(target=thread_function, args=(symbol,))
        time.sleep(2)
        x.start()
        
        # break # REMOVE THIS LINE
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