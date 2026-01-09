# Contract Verification Guide

## Deployed Contracts on Mantle Sepolia

| Contract | Address | Constructor Args |
|:---|:---|:---|
| MockUSDY | `0xBBc063b260b514c569bFcC5875512A5Eaa61a438` | None |
| YieldVault | `0x29c81174e1834d80ba68838ba2510a0a8c1970e4` | `0xBBc063b260b514c569bFcC5875512A5Eaa61a438` |
| MarketFactory | `0xd8c36684a5683d10707b05b948d746e994478bb8` | `0x29c81174e1834d80ba68838ba2510a0a8c1970e4` |
| Sample Market | `0x79B12Abd2f39B6Eb201b36bFdbB49479c783b4E3` | (created by Factory) |

## Generated Standard Input JSON Files

Each contract has its own verification file:

| Contract | File | Size |
|:---|:---|:---|
| MockUSDY | `MockUSDY-standard-input.json` | 8KB |
| YieldVault | `YieldVault-standard-input.json` | 14KB |
| MarketFactory | `MarketFactory-standard-input.json` | 29KB |

## Verification via Mantle Explorer (Manual)

### Step 1: Go to Explorer
- Sepolia: https://sepolia.mantlescan.xyz/verifyContract

### Step 2: Fill in Contract Details

**Common Settings for all contracts:**
- **Compiler Type**: `Solidity (Standard-Json-Input)`
- **Compiler Version**: `v0.8.23+commit.f704f362`
- **License Type**: `MIT License (MIT)`

### Step 3: Verify Each Contract

#### MockUSDY
1. Contract Address: `0xBBc063b260b514c569bFcC5875512A5Eaa61a438`
2. Upload: `MockUSDY-standard-input.json`
3. Contract Name: `MockUSDY`
4. No constructor arguments

#### YieldVault
1. Contract Address: `0x29c81174e1834d80ba68838ba2510a0a8c1970e4`
2. Upload: `YieldVault-standard-input.json`
3. Contract Name: `YieldVault`
4. Constructor Arguments (ABI-encoded):
```
0000000000000000000000000BBc063b260b514c569bFcC5875512A5Eaa61a438
```

#### MarketFactory
1. Contract Address: `0xd8c36684a5683d10707b05b948d746e994478bb8`
2. Upload: `MarketFactory-standard-input.json`
3. Contract Name: `MarketFactory`
4. Constructor Arguments (ABI-encoded):
```
00000000000000000000000029c81174e1834d80ba68838ba2510a0a8c1970e4
```

## Constructor Arguments Encoding

To get ABI-encoded constructor arguments:

```bash
# YieldVault (takes MockUSDY address)
cast abi-encode "constructor(address)" 0xBBc063b260b514c569bFcC5875512A5Eaa61a438
# Output: 0x000000000000000000000000bbc063b260b514c569bfcc5875512a5eaa61a438

# MarketFactory (takes YieldVault address)  
cast abi-encode "constructor(address)" 0x29c81174e1834d80ba68838ba2510a0a8c1970e4
# Output: 0x00000000000000000000000029c81174e1834d80ba68838ba2510a0a8c1970e4
```

Note: Remove the `0x` prefix when entering in the Explorer form.

## Troubleshooting

### "Unable to locate Contract Code" Error
This can happen if:
1. The Explorer hasn't indexed the contract yet - wait a few minutes
2. The API is experiencing issues - try again later
3. Wrong network selected - ensure you're on Sepolia

### API Issues
The Mantlescan API is currently migrating to V2. If CLI verification fails, use the manual UI method above.

## Verification via CLI (When API is Working)

```bash
# MockUSDY
forge verify-contract 0xBBc063b260b514c569bFcC5875512A5Eaa61a438 src/MockUSDY.sol:MockUSDY \
  --chain-id 5003 \
  --verifier-url "https://api-sepolia.mantlescan.xyz/api" \
  --etherscan-api-key YOUR_API_KEY

# YieldVault  
forge verify-contract 0x29c81174e1834d80ba68838ba2510a0a8c1970e4 src/YieldVault.sol:YieldVault \
  --chain-id 5003 \
  --verifier-url "https://api-sepolia.mantlescan.xyz/api" \
  --etherscan-api-key YOUR_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" 0xBBc063b260b514c569bFcC5875512A5Eaa61a438)

# MarketFactory
forge verify-contract 0xd8c36684a5683d10707b05b948d746e994478bb8 src/MarketFactory.sol:MarketFactory \
  --chain-id 5003 \
  --verifier-url "https://api-sepolia.mantlescan.xyz/api" \
  --etherscan-api-key YOUR_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" 0x29c81174e1834d80ba68838ba2510a0a8c1970e4)
```

## API Key
Get your Mantlescan API Key at: https://sepolia.mantlescan.xyz/myapikey
