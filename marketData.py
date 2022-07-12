import json
import pymongo
import mibian as mb
import datetime
import traceback

DEBUG = False

if DEBUG:
    f = open('./DATA/filteredData.json')
    data = json.load(f)

try:
    print("Connecting to Mongo DB")
    conn = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=10000)
    conn.server_info()
    print("Connected to Mongo DB")
except pymongo.errors.ConnectionFailure as err:
    print('ERROR: Could not connect to MongoDB')
    conn = None

if conn != None:
    database = conn['marketData']
    optionChainData = database['optionChainData']
    totalOI = database['totalOI']

    if DEBUG:
        # optionChainData.drop()
        # totalOI.drop()
        pass


def insertOptionChain(data, timeStampStr):
    if conn == None:
        print('ERROR: DB Connection unavailable, check your Mongo Server')
        return

    optionsData = data['data']
    totalCE = data['CE']
    totalPE = data['PE']
    timeStamp = datetime.datetime.strptime(timeStampStr, '%d-%b-%Y %H:%M:%S')
    symbol = optionsData[0]['CE']['underlying'] if optionsData[0]['CE'] != None else optionsData[0]['PE']['underlying']
    print("Inserting ", symbol, " Data")

    oiData = {
        'sequence': timeStamp.timestamp(),
        'timeStamp': timeStampStr,
        'date': timeStampStr.split(' ')[0],
        'symbol': symbol,
        'CE': totalCE,
        'PE': totalPE
    }
    try:
        totalOI.insert_one(oiData)
    except Exception:
        print('ERROR: DB Insertion failed, Possibly duplicate records...')
        # traceback.print_exc()

    for record in optionsData:
        callData = prepareOCData('CE', record['CE'], timeStamp, totalCE)
        putData = prepareOCData('PE', record['PE'], timeStamp, totalPE)
        ocData = {
            'sequence': timeStamp.timestamp(),
            'timeStamp': timeStampStr,
            'date': timeStampStr.split(' ')[0],
            'symbol': symbol,
            'strikePrice': record['strikePrice'],
            'expiryDate': record['expiryDate'],
            'CE': callData,
            'PE': putData
        }
        try:
            optionChainData.insert_one(ocData)
        except Exception:
            print('ERROR: DB Insertion failed, Possibly duplicate records...')
            # traceback.print_exc()


def prepareOCData(ceOrPe, data, timeStamp, totals):
    ocData = {
        'ltp': data['lastPrice'],
        'IV': data['impliedVolatility'],
        'volume': data['totalTradedVolume'],
        'OI': data['openInterest'],
        'changeInOI': data['changeinOpenInterest'],
        'TotalOI': totals['totOI'],
        'TotalVolume': totals['totVol'],
        'greeks': calculateGreeks(data['underlyingValue'], data['strikePrice'], data['expiryDate'], ceOrPe, data['impliedVolatility'], timeStamp)
    }
    return ocData


def calculateGreeks(spot, strike, expiryDate, ceOrPe, IV, timeStamp):
    if IV == 0:
        return {'delta': 0, 'theta': 0, 'gamma': 0, 'vega': 0}

    rateOfInterest = 0.1
    expiryDate = datetime.datetime.strptime(expiryDate, '%d-%b-%Y')
    expiryDate = expiryDate.replace(hour=15, minute=30, second=0, microsecond=0)
    days2expiry = (expiryDate-timeStamp).days + (expiryDate-timeStamp).seconds/86400

    greeks = mb.BS([spot, strike, rateOfInterest, days2expiry], volatility=IV)

    gamma = greeks.gamma
    vega = greeks.vega

    if ceOrPe == 'CE':
        delta = greeks.callDelta
        theta = greeks.callTheta
    elif ceOrPe == 'PE':
        delta = greeks.putDelta
        theta = greeks.putTheta

    return {'delta': delta, 'theta': theta, 'gamma': gamma, 'vega': vega}


if DEBUG:
    insertOptionChain(data, '08-Jul-2022 09:15:18')