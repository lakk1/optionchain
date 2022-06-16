# import requests
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Android 4.2.1; Mobile; rv:32.0) Gecko/32.0 Firefox/32.0'}
# url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
# data = requests.get(url, headers=headers)
# with open('data.json', 'w') as f:
#     f.write(data.text)


import requests

baseurl = "https://www.nseindia.com/"
# url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
url = "https://www.nseindia.com/api/option-chain-equities?symbol=AARTIIND"
headers = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
           'accept-language': 'en,gu;q=0.9,hi;q=0.8', 'accept-encoding': 'gzip, deflate, br'}
session = requests.Session()
request = session.get(baseurl, headers=headers, timeout=5)
cookies = dict(request.cookies)
response = session.get(url, headers=headers, timeout=5, cookies=cookies)
# print(response.json())
with open('data.json', 'w') as f:
    f.write(response.text)
