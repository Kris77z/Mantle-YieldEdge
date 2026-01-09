// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/YieldVault.sol";
import "../src/MarketFactory.sol";
import "../src/MockUSDY.sol";
import "../src/PredictionMarket.sol";

contract RedeploySystem is Script {
    address constant MOCK_USDY = 0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7; // Keep existing Token

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy New Vault
        YieldVault vault = new YieldVault(MOCK_USDY);
        console.log("New YieldVault:", address(vault));

        // 2. Deploy New Factory
        MarketFactory factory = new MarketFactory(address(vault));
        console.log("New MarketFactory:", address(factory));

        // 3. Authorize Factory
        vault.setAuthorizedFactory(address(factory));

        // 4. Create Markets
        // Market 1: BTC > 100k
        address m1 = factory.createMarket("Will BTC exceed $100k by end of January 2026?", 365 days);
        console.log("Market BTC:", m1);

        // Market 2: ETH > 5k
        address m2 = factory.createMarket("Will ETH reach $5,000 by March 2026?", 90 days);
        console.log("Market ETH:", m2);

        // Market 3: Mantle TVL
        address m3 = factory.createMarket("Will Mantle TVL exceed $2B in Q1 2026?", 90 days);
        console.log("Market Mantle:", m3);

        vm.stopBroadcast();
    }
}
