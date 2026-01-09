// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MockUSDY.sol";
import "../src/YieldVault.sol";
import "../src/PredictionMarket.sol";
import "../src/MarketFactory.sol";

/**
 * @title DeployYieldEdge
 * @notice Deployment script for YieldEdge contracts on Mantle Sepolia.
 * 
 * Usage:
 *   source .env
 *   forge script script/Deploy.s.sol:DeployYieldEdge --rpc-url mantle_sepolia --broadcast --verify
 */
contract DeployYieldEdge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockUSDY (for testnet demo)
        MockUSDY usdy = new MockUSDY();
        console.log("MockUSDY deployed at:", address(usdy));
        
        // 2. Deploy YieldVault
        YieldVault vault = new YieldVault(address(usdy));
        console.log("YieldVault deployed at:", address(vault));
        
        // 3. Deploy MarketFactory
        MarketFactory factory = new MarketFactory(address(vault));
        console.log("MarketFactory deployed at:", address(factory));
        
        // 4. Authorize factory to manage market authorizations in the vault
        vault.setAuthorizedFactory(address(factory));
        console.log("Factory authorized in vault");
        
        // 5. Create sample prediction markets via factory
        address market1 = factory.createMarket(
            "Will BTC exceed $100k by end of January 2026?",
            30 days
        );
        console.log("Market 1 deployed at:", market1);
        
        address market2 = factory.createMarket(
            "Will ETH reach $5,000 by March 2026?",
            60 days
        );
        console.log("Market 2 deployed at:", market2);
        
        address market3 = factory.createMarket(
            "Will Mantle TVL exceed $2B by Q2 2026?",
            90 days
        );
        console.log("Market 3 deployed at:", market3);
        
        // 6. Mint some test tokens to deployer for demo
        usdy.mint(msg.sender, 100000 ether);
        console.log("Minted 100,000 mUSDY to deployer");
        
        vm.stopBroadcast();
        
        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Mantle Sepolia (Chain ID: 5003)");
        console.log("MockUSDY:", address(usdy));
        console.log("YieldVault:", address(vault));
        console.log("MarketFactory:", address(factory));
        console.log("Markets Created:", factory.getMarketCount());
    }
}

