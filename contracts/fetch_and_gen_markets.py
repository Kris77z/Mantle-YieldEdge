import requests
import json
import time
from datetime import datetime

# Gamma API URL for trending markets
URL = "https://gamma-api.polymarket.com/markets?limit=20&active=true&closed=false&order=volume24hr&ascending=false"

def safe_str(s):
    return s.replace('"', '\"').replace("'", "")

try:
    print(f"Fetching markets from {URL}...")
    response = requests.get(URL)
    response.raise_for_status()
    markets = response.json()
    
    # Handle different response structures (array or .data)
    if isinstance(markets, dict) and 'data' in markets:
        markets = markets['data']
        
    print(f"Found {len(markets)} markets.")
    
    # Filter for valid expiry
    valid_markets = []
    seen_titles = set()
    
    for m in markets:
        # Check end date
        if 'endDate' not in m and 'clobTokenIds' not in m:
            continue
            
        ends_at_iso = m.get('endDate')
        if not ends_at_iso:
            continue
            
        try:
            # Parse ISO date (e.g. 2024-11-05T00:00:00Z)
            # Remove Z for simple parsing if needed, but fromisoformat handles it in Py 3.11+
            # Fallback for older python: replace Z with +00:00
            if ends_at_iso.endswith('Z'):
                ends_at_iso = ends_at_iso[:-1] + '+00:00'
            
            end_dt = datetime.fromisoformat(ends_at_iso)
            end_ts = int(end_dt.timestamp())
            
            # Skip if ended or ends very soon (e.g. < 24h)
            if end_ts < time.time() + 86400:
                continue
                
            question = m.get('question', '')
            if not question or question in seen_titles:
                continue
            
            # Simple Yes/No markets only for now (check outcomes)
            outcomes = m.get('outcomes', [])
            if len(outcomes) != 2 or outcomes[0] != 'Yes':
                continue
                
            seen_titles.add(question)
            valid_markets.append({
                'title': question,
                'end_ts': end_ts
            })
            
            if len(valid_markets) >= 10:
                break
                
        except Exception as e:
            # print(f"Error parsing date {ends_at_iso}: {e}")
            continue

    print(f"Generated {len(valid_markets)} valid markets commands.\n")
    
    # Generate Cast Commands
    print("#!/bin/bash")
    print("source .env")
    print("FACTORY=0x49B30Fa07a0437491584828B3D77E7891CDecb5d")
    print("")
    
    for m in valid_markets:
        title = safe_str(m['title'])
        ts = m['end_ts']
        print(f'echo "Creating: {title}"')
        print(f'cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "{title}" {ts} --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5')
        print("sleep 2") # Sleep to avoid nonce issues or rate limits
        print("")

except Exception as e:
    print(f"Error: {e}")

