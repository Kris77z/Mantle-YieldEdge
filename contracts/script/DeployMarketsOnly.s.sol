// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/YieldVault.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";

contract DeployMarketsOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultAddress = 0x8CcAC81591DdF38908D73e163958e7AAfa6D1c4b; // The new Flash Vault
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MarketFactory linked to new Vault
        MarketFactory factory = new MarketFactory(vaultAddress);
        console.log("New MarketFactory:", address(factory));
        
        // 2. Authorize Factory in Vault
        // Note: Deployer must be owner of Vault. If I deployed Vault, I am owner.
        YieldVault(vaultAddress).setAuthorizedFactory(address(factory));
        console.log("Factory Authorized");
        
        // 3. Create Representative Markets
        factory.createMarket("Will BTC exceed $100k by end of January 2026?", 30 days);
        factory.createMarket("Will ETH reach $5,000 by March 2026?", 60 days);
        factory.createMarket("Will Mantle TVL exceed $2B by Q2 2026?", 90 days);
        
        console.log("Markets Created");
        
        vm.stopBroadcast();
    }
}
