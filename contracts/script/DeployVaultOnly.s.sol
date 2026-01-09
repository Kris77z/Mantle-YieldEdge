// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MockUSDY.sol";
import "../src/YieldVault.sol";

contract DeployVaultOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockUSDY
        MockUSDY usdy = new MockUSDY();
        console.log("MockUSDY deployed at:", address(usdy));
        
        // 2. Deploy YieldVault
        YieldVault vault = new YieldVault(address(usdy));
        console.log("YieldVault deployed at:", address(vault));
        
        // Mint some USDY to deployer for testing
        usdy.mint(msg.sender, 100000 * 1e18);
        console.log("Minted 100k USDY to deployer");
        
        vm.stopBroadcast();
    }
}
