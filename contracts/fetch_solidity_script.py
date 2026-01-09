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
            
            duration = end_ts - now_ts
            if duration <= 0: continue

            q = m.get('question', '').replace('"', '').replace("'", "").replace("`", "")
            if not q or q in seen: continue
            q = q.encode('ascii', 'ignore').decode('ascii')
            if len(q) > 80: q = q[:77] + "..."

            seen.add(q)
            valid_markets.append((q, duration))
            if len(valid_markets) >= 10: break
        except:
            continue

    # Generate Solidity Script
    print("// SPDX-License-Identifier: MIT")
    print("pragma solidity ^0.8.20;")
    print("import \"forge-std/Script.sol\";")
    print("import \"forge-std/console.sol\";")
    print("")
    print("interface IMarketFactory {")
    print("    function createMarket(string memory question, uint256 duration) external returns (address);")
    print("}")
    print("")
    print("contract CreateTrendingMarkets is Script {")
    print("    function run() external {")
    print("        uint256 deployerPrivateKey = vm.envUint(\"PRIVATE_KEY\");")
    print("        address factoryAddr = 0x49B30Fa07a0437491584828B3D77E7891CDecb5d;")
    print("        IMarketFactory factory = IMarketFactory(factoryAddr);")
    print("")
    print("        vm.startBroadcast(deployerPrivateKey);")
    print("")

    for (title, duration) in valid_markets:
        print(f"        console.log(\"Creating market: {title}\");")
        print(f"        try factory.createMarket(\"{title}\", {duration}) {{")
        print("             console.log(\"   Success\");")
        print("        } catch Error(string memory reason) {")
        print("             console.log(\"   Failed:\", reason);")
        print("        } catch {")
        print("             console.log(\"   Failed (unknown)\");")
        print("        }")
        print("")

    print("        vm.stopBroadcast();")
    print("    }")
    print("}")

except Exception as e:
    print(f"// Error: {e}")
