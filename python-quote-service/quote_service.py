import os
from datetime import datetime, timezone

import requests
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query, Request

app = FastAPI(title="Stock Quote Service")

SUPPORTED_SYMBOLS = {
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA", "META", "BRK-B", "UNH", "V", 
    "JPM", "LLY", "AVGO", "XOM", "MA", "JNJ", "PG", "COST", "HD", "ADBE", 
    "NFLX", "AMD", "DIS", "CRM", "INTC", "PYPL", "VOO", "QQQ", "SPY", "BABA", 
    "RBLX", "WMT", "PEP", "KO", "BAC", "T", "VZ", "PFE", "MRK", "ABBV", 
    "ORCL", "CSCO", "ACN", "TXN", "QCOM", "MU", "AMAT", "UBER", "ABNB", "SQ", 
    "SHOP", "SE", "MELI", "SNOW", "PLTR", "TSM", "NKE", "SBUX", "GS", "MS",
    "SOFI", "U", "CRWD", "TGT", "CVX", "CAT", "DE", "COIN", "SCHD", "VTI", 
    "VT", "GME", "AMC", "MSTR"
}
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "").strip()


def _alpha_vantage_quote(symbol: str):
    if not ALPHA_VANTAGE_API_KEY:
        return None
    url = (
        "https://www.alphavantage.co/query"
        f"?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
    )
    resp = requests.get(url, timeout=6)
    if resp.status_code != 200:
        return None
    data = resp.json().get("Global Quote", {})
    price_raw = data.get("05. price")
    change_pct_raw = data.get("10. change percent", "0%")
    if not price_raw:
        return None
    price = float(price_raw)
    change_pct = float(change_pct_raw.replace("%", "").strip())
    return {
        "symbol": symbol,
        "name": symbol,
        "currentPrice": round(price, 2),
        "changePct": round(change_pct, 2),
        "source": "alpha_vantage",
    }


def _yfinance_quote(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.fast_info or {}
    last_price = info.get("lastPrice")
    prev_close = info.get("previousClose")
    if not last_price:
        hist = ticker.history(period="2d", interval="1d")
        if hist.empty:
            return None
        last_price = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last_price
    if not prev_close:
        prev_close = last_price
    change_pct = ((float(last_price) - float(prev_close)) / float(prev_close)) * 100 if prev_close else 0.0
    return {
        "symbol": symbol,
        "name": symbol,
        "currentPrice": round(float(last_price), 2),
        "changePct": round(float(change_pct), 2),
        "source": "yfinance",
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/quote")
def quote(
    request: Request,
    symbol: str | None = Query(None, min_length=1),
    ticker: str | None = Query(None, min_length=1),
):
    # Helpful when debugging malformed query strings from clients.
    print("Received params:", dict(request.query_params))

    raw_symbol = symbol if symbol is not None else ticker
    if raw_symbol is None:
        raise HTTPException(status_code=400, detail="symbol (or ticker) query parameter is required")

    normalized = raw_symbol.upper().strip()
    if normalized not in SUPPORTED_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"Unsupported symbol: {normalized}")

    quote_data = _alpha_vantage_quote(normalized)
    if quote_data is None:
        quote_data = _yfinance_quote(normalized)
    if quote_data is None:
        raise HTTPException(status_code=503, detail="No live quote available")

    quote_data["asOf"] = datetime.now(timezone.utc).isoformat()
    return quote_data


def _history_config(timeframe: str):
    normalized = timeframe.upper()
    configs = {
        "1D": {"period": "1d", "interval": "15m"},
        "1W": {"period": "5d", "interval": "1h"},
        "1M": {"period": "1mo", "interval": "1d"},
        "ALL": {"period": "3mo", "interval": "1wk"},
    }
    if normalized not in configs:
        raise HTTPException(status_code=400, detail=f"Unsupported timeframe: {timeframe}")
    return configs[normalized]


@app.get("/history")
def history(
    symbol: str = Query(..., min_length=1),
    timeframe: str = Query("1D", min_length=2),
):
    normalized = symbol.upper().strip()
    if normalized not in SUPPORTED_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"Unsupported symbol: {normalized}")

    config = _history_config(timeframe)
    ticker = yf.Ticker(normalized)
    hist = ticker.history(
        period=config["period"],
        interval=config["interval"],
        auto_adjust=False,
        prepost=True,
    )

    if hist.empty:
        raise HTTPException(status_code=503, detail="No historical data available")

    points = []
    for index, row in hist.iterrows():
        timestamp = index.to_pydatetime()
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        else:
            timestamp = timestamp.astimezone(timezone.utc)

        close = row.get("Close")
        if close is None:
            continue

        points.append(
            {
                "timestamp": timestamp.isoformat(),
                "price": round(float(close), 2),
            }
        )

    if not points:
        raise HTTPException(status_code=503, detail="No historical data available")

    return {
        "symbol": normalized,
        "timeframe": timeframe.upper(),
        "points": points,
        "asOf": datetime.now(timezone.utc).isoformat(),
    }
