#!/bin/bash
source .env
FACTORY=0x49B30Fa07a0437491584828B3D77E7891CDecb5d

echo "Creating: Fed decreases interest rates by 50+ bps after January 2026 meeting?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Fed decreases interest rates by 50+ bps after January 2026 meeting?" 1769529600 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Fed increases interest rates by 25+ bps after January 2026 meeting?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Fed increases interest rates by 25+ bps after January 2026 meeting?" 1769529600 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Will the Indiana Pacers win the 2026 NBA Finals?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Will the Indiana Pacers win the 2026 NBA Finals?" 1782835200 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Maduro in U.S. custody by January 31?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Maduro in U.S. custody by January 31?" 1769788800 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Will Trump nominate Barron Trump as the next Fed chair?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Will Trump nominate Barron Trump as the next Fed chair?" 1798646400 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Will Trump nominate himself as the next Fed chair?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Will Trump nominate himself as the next Fed chair?" 1798646400 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: No change in Fed interest rates after January 2026 meeting?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "No change in Fed interest rates after January 2026 meeting?" 1769529600 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Fed decreases interest rates by 25 bps after January 2026 meeting?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Fed decreases interest rates by 25 bps after January 2026 meeting?" 1769529600 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Khamenei out as Supreme Leader of Iran by January 31?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Khamenei out as Supreme Leader of Iran by January 31?" 1769788800 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

echo "Creating: Over $5M committed to the Infinex public sale?"
cast send 0x49B30Fa07a0437491584828B3D77E7891CDecb5d "createMarket(string,uint256)" "Over $5M committed to the Infinex public sale?" 1798750800 --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0x7f9a4aa8ad8c95c2e402ab69f1b2f07a05303d3cf6e9f2d95f53539dbdce91d5 --gas-limit 1000000000
sleep 3

