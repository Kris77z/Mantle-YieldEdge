// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MockUSDY.sol";
import "../src/YieldVault.sol";
import "../src/MarketFactory.sol";

/**
 * @title DeployMinimal
 * @notice Minimal deployment script - only deploys core contracts.
 * 
 * Usage:
 *   source .env
 *   forge script script/DeployMinimal.s.sol:DeployMinimal --rpc-url mantle_sepolia --broadcast
 */
contract DeployMinimal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockUSDY
        MockUSDY usdy = new MockUSDY();
        console.log("MockUSDY deployed at:", address(usdy));
        
        // 2. Deploy YieldVault
        YieldVault vault = new YieldVault(address(usdy));
        console.log("YieldVault deployed at:", address(vault));
        
        // 3. Deploy MarketFactory
        MarketFactory factory = new MarketFactory(address(vault));
        console.log("MarketFactory deployed at:", address(factory));
        
        // 4. Authorize factory
        vault.setAuthorizedFactory(address(factory));
        console.log("Factory authorized");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("MockUSDY:", address(usdy));
        console.log("YieldVault:", address(vault));  
        console.log("MarketFactory:", address(factory));
    }
}
