import requests
import json
import time
from datetime import datetime

URL = "https://gamma-api.polymarket.com/markets?limit=100&active=true&closed=false&order=volume24hr&ascending=false"

try:
    response = requests.get(URL, timeout=10)
    markets = response.json()
    if isinstance(markets, dict) and 'data' in markets:
        markets = markets['data']

    valid_markets = []
    seen = set()

    now_ts = int(time.time())

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

            if end_ts < now_ts + 86400: continue
            
            # Calculate Duration
            duration = end_ts - now_ts
            if duration <= 0: continue

            q = m.get('question', '').replace('"', '').replace("'", "").replace("`", "")
            if not q or q in seen: continue
            # Ensure safe ASCII
            q = q.encode('ascii', 'ignore').decode('ascii')
            if len(q) > 80: q = q[:77] + "..."

            seen.add(q)
            valid_markets.append((q, duration))
            if len(valid_markets) >= 10: break
        except:
            continue

    print("#!/bin/bash")
    print("source .env")
    print("export PATH=\"$HOME/.foundry/bin:$PATH\"")
    print("FACTORY=0x49B30Fa07a0437491584828B3D77E7891CDecb5d")
    print("")

    for (title, duration) in valid_markets:
        print(f'echo "Creating: {title}"')
        # Use 150M gas limit
        print(f'cast send $FACTORY "createMarket(string,uint256)" "{title}" {duration} --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000')
        print("sleep 5")
        print("")

except Exception as e:
    print(f"# Error: {e}")
