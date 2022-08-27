import mibian as mb
import pandas as pd
import psycopg2
import psycopg2.extras as extras
import json
import datetime
import traceback

DEBUG = True

if DEBUG:
    f = open('./DATA/NIFTY/NIFTY.json')
    data = json.load(f)

try:
    print("Connecting to Postgres DB")
    conn = psycopg2.connect(user="postgres", password="password", host="127.0.0.1", port="5432", database="marketData")
    cursor = conn.cursor()
    print("Connected to Postgres DB")
except (Exception, psycopg2.Error) as error:
    print('ERROR: Could not connect to Postgres DB {}'.format(error))
    conn = None


def storeOptionChain(data):
    if conn == None:
        print('ERROR: DB Connection unavailable, check your Postgres Server')
        return

    timeStamp = datetime.datetime.strptime(data['records']['timestamp'], '%d-%b-%Y %H:%M:%S')
    expiryDates = data['records']['expiryDates'][0:3]
    symbol = data['records']['data'][0]['CE']['underlying'] if data['records']['data'][0].get('CE') else data['records']['data'][0]['PE']['underlying']

    if isNewTimeStamp(symbol, timeStamp):
        for expiry in expiryDates:
            for oType in ['CE', 'PE']:
                df = [d[oType] for d in data['records']['data'] if d['expiryDate'] == expiry and oType in d.keys()]
                df = pd.json_normalize(df)
                df.drop(['identifier', 'pchangeinOpenInterest', 'change', 'pChange', 'totalBuyQuantity', 'totalSellQuantity', 'bidQty', 'bidprice', 'askQty', 'askPrice'], axis=1, inplace=True)
                # Temp code to be removed
                if all(col in df.columns for col in ['greeks.delta', 'greeks.theta', 'greeks.gamma', 'greeks.vega']):
                    df.drop(['greeks.delta', 'greeks.theta', 'greeks.gamma', 'greeks.vega'], axis=1, inplace=True)
                # End of temp code to be removed
                df.columns = ['strikePrice', 'expiryDate', 'symbol', 'openInt', 'openIntChg', 'volume', 'iv', 'ltp', 'symbolLtp']
                df['optionType'] = oType
                df['timeStamp'] = timeStamp
                df = df[['timeStamp', 'symbol', 'symbolLtp', 'optionType', 'expiryDate', 'strikePrice', 'ltp', 'openInt', 'openIntChg', 'volume', 'iv']]
                df[['delta', 'theta', 'gamma', 'vega']] = 0
                for index, row in df.iterrows():
                    greeks = calculateGreeks(row['symbolLtp'], row['strikePrice'], row['expiryDate'], row['optionType'], row['iv'], row['timeStamp'])
                    df.loc[index, 'delta'] = greeks['delta']
                    df.loc[index, 'theta'] = greeks['theta']
                    df.loc[index, 'gamma'] = greeks['gamma']
                    df.loc[index, 'vega'] = greeks['vega']
                insertIntoDB(df)
            

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
    try:
        selectSql = f"select * from public.lastchecked where symbol = '{symbol}' and timeStamp = to_timestamp(\'{timeStamp}\', 'yyyy-mm-dd hh24:mi:ss')"
        cursor.execute(selectSql)
        result = cursor.fetchall()
        if result == []:
            try:
                insertSql = f"insert into public.lastchecked (timestamp, symbol) values (to_timestamp(\'{timeStamp}\', 'yyyy-mm-dd hh24:mi:ss'), '{symbol}')"
                cursor.execute(insertSql)
                conn.commit()
                return True
            except (Exception, psycopg2.Error) as error:
                print("Failed inserting record into lastchecked table {}".format(error))
        elif result[0][0] != timeStamp:
            try:
                updateSql = f"Update public.lastchecked set timestamp = to_timestamp(\'{timeStamp}\', 'yyyy-mm-dd hh24:mi:ss') where symbol = '{symbol}'"
                cursor.execute(updateSql)
                conn.commit
                return True
            except (Exception, psycopg2.Error) as error:
                print("Failed to update record in lastchecked table {}".format(error))
        else:
            return False
    except (Exception, psycopg2.Error) as error:
        print("Failed selecting record from lastchecked table {}".format(error))


def insertIntoDB(df):
    tuples = [tuple(x) for x in df.to_numpy()]
    cols = ','.join(list(df.columns))
    sql = f'INSERT INTO optionchain({cols}) VALUES %s'
    try:
        extras.execute_values(cursor, sql, tuples)
        conn.commit()
    except (Exception, psycopg2.Error) as error:
        print("Failed inserting option chain data {}".format(error))
        conn.rollback()
        return 1

if DEBUG:
    storeOptionChain(data)