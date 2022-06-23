# import requests
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Android 4.2.1; Mobile; rv:32.0) Gecko/32.0 Firefox/32.0'}
# url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
# data = requests.get(url, headers=headers)
# with open('data.json', 'w') as f:
#     f.write(data.text)

import sys
import requests
import os
import traceback
import logging


baseurl = "https://www.nseindia.com/"
# url = f"https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"

headers = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
           'accept-language': 'en,gu;q=0.9,hi;q=0.8', 'accept-encoding': 'gzip, deflate, br'}
session = requests.Session()
request = session.get(baseurl, headers=headers, timeout=8)
cookies = dict(request.cookies)

def createDirectory(sym):
    logging.debug("Checking Dir: %s", sym) 

    dir = os.path.join("DATA", sym)
    try:
        if not os.path.exists(dir):
            logging.debug("Creating new folder: %s", sym) 
            os.makedirs(dir)
    except:
        logging.critical("ERROR: Failed to create directory: %s", dir)
           
    return dir

def scan(symbol):
    try:
        suffix = 'indices' if symbol == 'NIFTY' or symbol == 'BANKNIFTY' else 'equities'
        url = f"https://www.nseindia.com/api/option-chain-" + suffix + "?symbol=" + symbol
        # print("Scanning :", url)
        # print('URL:'+url, file=sys.stderr)

        response = session.get(url, headers=headers, timeout=20, cookies=cookies)

        dir = createDirectory(symbol)
        filename = os.path.join(dir, symbol + ".json")
        with open(filename, 'w') as f:
            f.write(response.text)

        return filename
    except Exception:
        # traceback.print_exc()
        return ""

symbol = 'NIFTY'
response = ''
if len(sys.argv) == 2:
    # print("len:", len(sys.argv))
    # print('Argument List:', str(sys.argv))
    symbol = sys.argv[1]
    response = scan(symbol)

print(response)