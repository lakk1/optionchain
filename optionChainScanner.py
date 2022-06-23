import logging
import os
import json
import requests
import threading
import time
import datetime
import traceback
import scanner


SLEEP_INTERVAL = 60 # seconds
SOURCE_FILE = "symbols.json"
# SOURCE_FILE = "sample.json"
LOOP = 2

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
def thread_function(sym):
    logging.info("Thread %s: starting", sym)
    
    # for i in range(LOOP): # Call LOOP times
    while True:
        now = datetime.datetime.now().time()
        
        if now > datetime.time(9, 5, 0, 999999):
            fetchData(sym)
            time.sleep(SLEEP_INTERVAL)
        elif now > datetime.time(15, 32, 59, 999999):
            break
        else:
            time.sleep(180)

    logging.info("Thread %s: finishing", sym)
"""
END OF thread_function
"""


"""
FUNCTION: fetchData STARTED
"""
def fetchData(sym):
    # url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
    # url = "https://www.nseindia.com/api/option-chain-equities?symbol=SBIN"

    suffix = 'indices' if sym == 'NIFTY' or sym == 'BANKNIFTY' else 'equities'
    url = "https://www.nseindia.com/api/option-chain-" + suffix + "?symbol=" + sym
    logging.info("URL: "+ url)

    try:
        response = session.get(url, headers=headers, timeout=10, cookies=cookies)
        print("Got response for:", url)
        # print(response.json())

        jsonResponse = response.json()

        if jsonResponse and jsonResponse["records"]:
            timestamp = jsonResponse["records"]["timestamp"]
            responseDate = timestamp.split(' ')[0]
            responseTime = timestamp.split(' ')[1].replace(':', '_')

            dir = createDirectory(sym, responseDate)
            filename = os.path.join(dir, sym + '_' + responseTime +".json")
            if os.path.exists(filename):
                logging.info("File "+ filename +" already exists")
            else:
                with open(filename, 'w') as f:
                    f.write(json.dumps(jsonResponse))

                dir = os.path.join("DATA", sym)
                filename = os.path.join(dir, sym + ".json")
                with open(filename, 'w') as f:
                    f.write(json.dumps(jsonResponse, indent=1))
        else:
            logging.error("ERROR: Fetching data for " + sym)
            logging.info(response)
    except Exception:
        traceback.print_exc()
        logging.warning("Failed to fetch data for:" + sym)
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
async def main():

    logging.info("Main : Opening Symbols")
    f = open(SOURCE_FILE, "r")
    data = json.loads(f.read())

    for sym in data:
        symbol = sym['symbol']
        suffix = 'indices' if symbol == 'NIFTY' or symbol == 'BANKNIFTY' else 'equities'
        url = f"https://www.nseindia.com/api/option-chain-" + suffix + "?symbol=" + symbol
        scanner.scan(url)
        # fetchLoop(sym['symbol'])

        # x = threading.Thread(target=thread_function, args=(sym['symbol'],))
        # time.sleep(1)
        # x.start()
        
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