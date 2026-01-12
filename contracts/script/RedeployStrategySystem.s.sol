// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/StrategyVault.sol";
import "../src/PredictionMarket.sol";
import "../src/YieldVault.sol";

/**
 * @title RedeployStrategySystem
 * @notice Redeploy PredictionMarket (with fix for adding to positions) and StrategyVault
 * 
 * This script:
 * 1. Creates a new PredictionMarket (fresh, no prior bets)
 * 2. Authorizes the new market in the existing YieldVault
 * 3. Deploys a new StrategyVault pointing to the new market
 * 
 * Usage:
 *   cd contracts
 *   source .env
 *   forge script script/RedeployStrategySystem.s.sol:RedeployStrategySystem --rpc-url mantle_sepolia --broadcast
 */
contract RedeployStrategySystem is Script {
    // Existing System Addresses (Mantle Sepolia) - DO NOT CHANGE
    address constant YIELD_VAULT = 0x1676614C211795e3990Df2F4d7cc028C9B347ADF;
    address constant MOCK_USDY = 0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Using existing YieldVault:", YIELD_VAULT);
        console.log("Using existing MockUSDY:", MOCK_USDY);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy a NEW PredictionMarket with fresh state
        PredictionMarket newMarket = new PredictionMarket(
            YIELD_VAULT,
            "Will BTC exceed $100k by end of January 2026?",
            60 days, // Extended duration
            deployer  // Owner
        );
        console.log("New PredictionMarket deployed at:", address(newMarket));

        // 2. Authorize the new market in YieldVault
        YieldVault vault = YieldVault(YIELD_VAULT);
        vault.setMarketAuthorization(address(newMarket), true);
        console.log("New market authorized in YieldVault");

        // 3. Deploy new StrategyVault pointing to the new market
        StrategyVault newStrategy = new StrategyVault(
            YIELD_VAULT,
            address(newMarket),
            MOCK_USDY,
            "BTC Bull Max Strategy V2",
            30 days,
            PredictionMarket.Outcome.Yes
        );
        console.log("New StrategyVault deployed at:", address(newStrategy));

        vm.stopBroadcast();

        // Summary
        console.log("\n=== Redeployment Summary ===");
        console.log("New PredictionMarket:", address(newMarket));
        console.log("New StrategyVault:", address(newStrategy));
        console.log("\n>>> UPDATE frontend/src/config/contracts.ts with:");
        console.log("    strategies.btcBull.address:", address(newStrategy));
    }
}
