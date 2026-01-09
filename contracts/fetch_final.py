import requests
import json
import time
from datetime import datetime

URL = "https://gamma-api.polymarket.com/markets?limit=100&active=true&closed=false&order=volume24hr&ascending=false"

try:
    response = requests.get(URL)
    markets = response.json()
    if isinstance(markets, dict) and 'data' in markets:
        markets = markets['data']

    valid_markets = []
    seen = set()

    for m in markets:
        try:
            outcomes = m.get('outcomes')
            if isinstance(outcomes, str):
                outcomes = json.loads(outcomes)
            
            if not isinstance(outcomes, list) or len(outcomes) != 2:
                continue
            if outcomes[0] != "Yes" or outcomes[1] != "No":
                continue

            end_s = m.get('endDate')
            if not end_s: continue
            if end_s.endswith('Z'): end_s = end_s[:-1]
            end_dt = datetime.fromisoformat(end_s)
            end_ts = int(end_dt.timestamp())

            if end_ts < time.time() + 86400: continue

            q = m.get('question', '').replace('"', '').replace("'", "")
            if not q or q in seen: continue
            if len(q) > 80: q = q[:77] + "..."

            seen.add(q)
            valid_markets.append((q, end_ts))
            if len(valid_markets) >= 10: break
        except:
            continue

    print("#!/bin/bash")
    print("source .env")
    print("FACTORY=0x49B30Fa07a0437491584828B3D77E7891CDecb5d")
    print("")

    for (title, ts) in valid_markets:
        print(f'echo "Creating: {title}"')
        print(f'cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "{title}" {ts} --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 8000000')
        print("sleep 3")
        print("")

except Exception as e:
    print(f"# Error: {e}")
