// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/YieldVault.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";

/**
 * @title RedeployMarkets
 * @notice Redeploy MarketFactory and markets with updated PredictionMarket contract
 *         that allows users to add to their positions.
 */
contract RedeployMarkets is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Existing USDY YieldVault (DO NOT CHANGE)
        address vaultAddress = 0x1676614C211795e3990Df2F4d7cc028C9B347ADF;
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy new MarketFactory (uses updated PredictionMarket)
        MarketFactory factory = new MarketFactory(vaultAddress);
        console.log("New MarketFactory:", address(factory));
        
        // 2. Authorize Factory in Vault
        YieldVault(vaultAddress).setAuthorizedFactory(address(factory));
        console.log("Factory Authorized in Vault");
        
        // 3. Create Markets
        address btcMarket = address(factory.createMarket("Will BTC exceed $100k by end of January 2026?", 30 days));
        console.log("BTC Market:", btcMarket);
        
        address ethMarket = address(factory.createMarket("Will ETH reach $5,000 by March 2026?", 60 days));
        console.log("ETH Market:", ethMarket);
        
        address mantleMarket = address(factory.createMarket("Will Mantle TVL exceed $2B by Q2 2026?", 90 days));
        console.log("Mantle Market:", mantleMarket);
        
        console.log("=================================");
        console.log("Deployment Complete! Update frontend/src/config/contracts.ts:");
        console.log("  marketFactory:", address(factory));
        console.log("  usdy.factory:", address(factory));
        console.log("=================================");
        
        vm.stopBroadcast();
    }
}
