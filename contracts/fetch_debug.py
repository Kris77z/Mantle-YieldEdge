import requests
import json
import time
from datetime import datetime

URL = "https://gamma-api.polymarket.com/markets?limit=50&active=true&closed=false&order=volume24hr&ascending=false"

print(f"Fetching from {URL}")
resp = requests.get(URL).json()
markets = resp if isinstance(resp, list) else resp.get('data', [])
print(f"Total raw markets: {len(markets)}")

for i, m in enumerate(markets[:5]):
    print(f"--- Market {i} ---")
    print(f"Q: {m.get('question')}")
    print(f"Outcomes Raw: {m.get('outcomes')} Type: {type(m.get('outcomes'))}")
    endDate = m.get('endDate')
    print(f"End: {endDate}")
    
    # Try parse outcomes
    outcomes = m.get('outcomes')
    if isinstance(outcomes, str):
        try:
            outcomes = json.loads(outcomes)
            print(f"Parsed outcomes: {outcomes}")
        except Exception as e:
            print(f"Outcome parse error: {e}")

