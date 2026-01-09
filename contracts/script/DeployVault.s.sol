// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/YieldVault.sol";
import "../src/MarketFactory.sol";

/**
 * @title DeployVault
 * @notice Deploy YieldVault and MarketFactory using existing MockUSDY.
 * 
 * Usage:
 *   forge script script/DeployVault.s.sol:DeployVault --rpc-url mantle_sepolia --broadcast
 */
contract DeployVault is Script {
    // Already deployed MockUSDY
    address constant MOCK_USDY = 0xBBc063b260b514c569bFcC5875512A5Eaa61a438;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy YieldVault with existing MockUSDY
        YieldVault vault = new YieldVault(MOCK_USDY);
        console.log("YieldVault deployed at:", address(vault));
        
        // 2. Deploy MarketFactory
        MarketFactory factory = new MarketFactory(address(vault));
        console.log("MarketFactory deployed at:", address(factory));
        
        // 3. Authorize factory
        vault.setAuthorizedFactory(address(factory));
        console.log("Factory authorized");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("MockUSDY (existing):", MOCK_USDY);
        console.log("YieldVault:", address(vault));  
        console.log("MarketFactory:", address(factory));
    }
}
