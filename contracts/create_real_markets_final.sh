#!/bin/bash
source .env
export PATH="$HOME/.foundry/bin:$PATH"
FACTORY=0x49B30Fa07a0437491584828B3D77E7891CDecb5d

echo "Creating: Fed decreases interest rates by 50+ bps after January 2026 meeting?"
cast send $FACTORY "createMarket(string,uint256)" "Fed decreases interest rates by 50+ bps after January 2026 meeting?" 1846945 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Fed increases interest rates by 25+ bps after January 2026 meeting?"
cast send $FACTORY "createMarket(string,uint256)" "Fed increases interest rates by 25+ bps after January 2026 meeting?" 1846945 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Will the Indiana Pacers win the 2026 NBA Finals?"
cast send $FACTORY "createMarket(string,uint256)" "Will the Indiana Pacers win the 2026 NBA Finals?" 15152545 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Maduro in U.S. custody by January 31?"
cast send $FACTORY "createMarket(string,uint256)" "Maduro in U.S. custody by January 31?" 2106145 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Will Trump nominate Barron Trump as the next Fed chair?"
cast send $FACTORY "createMarket(string,uint256)" "Will Trump nominate Barron Trump as the next Fed chair?" 30963745 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Will Trump nominate himself as the next Fed chair?"
cast send $FACTORY "createMarket(string,uint256)" "Will Trump nominate himself as the next Fed chair?" 30963745 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: No change in Fed interest rates after January 2026 meeting?"
cast send $FACTORY "createMarket(string,uint256)" "No change in Fed interest rates after January 2026 meeting?" 1846945 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Fed decreases interest rates by 25 bps after January 2026 meeting?"
cast send $FACTORY "createMarket(string,uint256)" "Fed decreases interest rates by 25 bps after January 2026 meeting?" 1846945 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Khamenei out as Supreme Leader of Iran by January 31?"
cast send $FACTORY "createMarket(string,uint256)" "Khamenei out as Supreme Leader of Iran by January 31?" 2106145 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

echo "Creating: Over $5M committed to the Infinex public sale?"
cast send $FACTORY "createMarket(string,uint256)" "Over $5M committed to the Infinex public sale?" 31068145 --rpc-url $MANTLE_SEPOLIA_RPC --private-key $PRIVATE_KEY --gas-limit 150000000
sleep 5

