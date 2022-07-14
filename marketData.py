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
    filteredData = database['filteredData']
    totalOI = database['totalOI']
    lastChecked = database['lastChecked']

    if DEBUG:
        # optionChainData.drop()
        # totalOI.drop()
        pass


def storeFilteredData(data, timeStampStr):
    if conn == None:
        print('ERROR: DB Connection unavailable, check your Mongo Server')
        return

    optionsData = data['data']
    totalCE = data['CE']
    totalPE = data['PE']
    timeStamp = datetime.datetime.strptime(timeStampStr, '%d-%b-%Y %H:%M:%S')
    symbol = optionsData[0]['CE']['underlying'] if optionsData[0]['CE'] != None else optionsData[0]['PE']['underlying']

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
        if record.get('CE'):
            callData = prepareOCData('CE', record['CE'], timeStamp, totalCE)
        if record.get('PE'):
            putData = prepareOCData('PE', record['PE'], timeStamp, totalPE)
        ocData = {
            'sequence': timeStamp.timestamp(),
            'timeStamp': timeStampStr,
            'date': timeStampStr.split(' ')[0],
            'symbol': symbol,
            'strikePrice': record['strikePrice'],
            'expiryDate': record['expiryDate'],
            'CE': callData or None,
            'PE': putData or None
        }
        try:
            filteredData.insert_one(ocData)
        except Exception:
            print('ERROR: DB Insertion failed, Possibly duplicate records...')
            # traceback.print_exc()


def storeOptionChain(data):
    if conn == None:
        print('ERROR: DB Connection unavailable, check your Mongo Server')
        return

    timeStampStr = data['records']['timestamp']
    symbol = data['records']['data'][0]['CE']['underlying'] if data['records']['data'][0].get('CE') else data['records']['data'][0]['PE']['underlying']
    if isNewTimeStamp(symbol, timeStampStr):
        print("Inserting ", symbol, " Data")
        nextExpiry = data['records']['expiryDates'][1]
        futureExpiry = data['records']['expiryDates'][2]
        timeStamp = datetime.datetime.strptime(timeStampStr, '%d-%b-%Y %H:%M:%S')
        date = timeStampStr.split(' ')[0]
        currentData = data['filtered']
        storeFilteredData(currentData, timeStampStr)
        data['filtered'] = appendGreeks(currentData, timeStamp)
        data['records'] = appendGreeks(data['records'], timeStamp, nextExpiry)
        data['records'] = appendGreeks(data['records'], timeStamp, futureExpiry)
        ocData = {
            'sequence': timeStamp.timestamp(),
            'timeStamp': timeStampStr,
            'date': date,
            'symbol': symbol,
            'data': data
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
    default = {'delta': 0, 'theta': 0, 'gamma': 0, 'vega': 0}
    rateOfInterest = 0.1
    expiryDate = datetime.datetime.strptime(expiryDate, '%d-%b-%Y')
    expiryDate = expiryDate.replace(hour=15, minute=30, second=0, microsecond=0)
    days2expiry = (expiryDate-timeStamp).days + (expiryDate-timeStamp).seconds/86400

    if IV == 0 or days2expiry == 0:
        return default

    try:
        greeks = mb.BS([spot, strike, rateOfInterest, days2expiry], volatility=IV)

        default['gamma'] = greeks.gamma
        default['vega'] = greeks.vega

        if ceOrPe == 'CE':
            default['delta'] = greeks.callDelta
            default['theta'] = greeks.callTheta
        elif ceOrPe == 'PE':
            default['delta'] = greeks.putDelta
            default['theta'] = greeks.putTheta
    except Exception:
        print('ERROR: Greeks calculation failed returned null values')
        # traceback.print_exc()

    return default


def isNewTimeStamp(symbol, timeStamp):
    if lastChecked.find_one({'symbol': symbol}) == None:
        lastChecked.insert_one({'symbol': symbol, 'lastCheckedOn': timeStamp})
        return True
    elif lastChecked.find_one({'symbol': symbol})['lastCheckedOn'] != timeStamp:
        filter = {'symbol': symbol}
        update = {"$set": {'lastCheckedOn': timeStamp}}
        lastChecked.update_one(filter, update)
        return True
    else:
        return False


def appendGreeks(data, timeStamp, expiry=None):
    for record in data['data']:
        shouldCalculate = False if expiry and record['expiryDate'] != expiry else True
        if shouldCalculate:
            if record.get('CE'):
                record['CE']['greeks'] = calculateGreeks(record['CE']['underlyingValue'], record['CE']['strikePrice'], record['CE']['expiryDate'], 'CE', record['CE']['impliedVolatility'], timeStamp)
            if record.get('PE'):
                record['PE']['greeks'] = calculateGreeks(record['PE']['underlyingValue'], record['PE']['strikePrice'], record['PE']['expiryDate'], 'PE', record['PE']['impliedVolatility'], timeStamp)
    return data


if DEBUG:
    storeOptionChain(data, '08-Jul-2022 09:15:18')