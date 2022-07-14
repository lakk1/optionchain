import logging
import json
import requests
import threading
import time
import datetime
import traceback
from marketData import storeOptionChain


DB_ENABLED = True
SLEEP_INTERVAL = 60 # seconds
SOURCE_FILE = "symbols.json"
# SOURCE_FILE = "sample.json"
LOOP = 1


baseurl = "https://www.nseindia.com/"
# url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
# url = "https://www.nseindia.com/api/option-chain-equities?symbol=SBIN"

headers = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
           'accept-language': 'en,gu;q=0.9,hi;q=0.8', 'accept-encoding': 'gzip, deflate, br'}
session = requests.Session()
request = session.get(baseurl, headers=headers, timeout=8)
cookies = dict(request.cookies)

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
    logging.info("INFO: Requested data for: %s", symbol)

    try:
        suffix = 'indices' if symbol == 'NIFTY' or symbol == 'BANKNIFTY' else 'equities'
        url = f"https://www.nseindia.com/api/option-chain-" + suffix + "?symbol=" + symbol
        jsonResponse = session.get(url, headers=headers, timeout=20, cookies=cookies)
    except Exception:
        logging.warning("EXCEPTION: --------- Failed to fetch data for:" + symbol)
        traceback.print_exc()

    if jsonResponse and jsonResponse.ok:
        jsonResponse = json.loads(jsonResponse.text)
        if jsonResponse.get('records'):
            logging.info("INFO: Storing data for: %s", symbol)
            storeOptionChain(jsonResponse)
    else:
        logging.error("ERROR: --------- Records not found " + symbol)
"""
END OF fechData
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