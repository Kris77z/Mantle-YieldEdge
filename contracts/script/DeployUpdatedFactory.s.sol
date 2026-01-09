// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";
import "../src/YieldVault.sol";

/**
 * @title DeployUpdatedFactory
 * @notice Deploys updated MarketFactory with owner-aware PredictionMarket
 */
contract DeployUpdatedFactory is Script {
    // Existing USDY Vault address
    address constant YIELD_VAULT = 0x29C81174e1834D80bA68838bA2510A0A8c1970e4;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Deploying Updated MarketFactory ===");
        console.log("Deployer:", deployer);
        console.log("Using existing Vault:", YIELD_VAULT);

        YieldVault vault = YieldVault(YIELD_VAULT);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new MarketFactory
        MarketFactory factory = new MarketFactory(YIELD_VAULT);
        console.log("New MarketFactory:", address(factory));

        // Authorize the new factory in the vault
        vault.setAuthorizedFactory(address(factory));
        console.log("Factory authorized in Vault");

        // Create a test market (deployer will be owner)
        address market = factory.createMarket(
            "Test: Will this loop complete successfully?",
            1 hours
        );
        console.log("Test Market created:", market);
        
        // Verify owner
        PredictionMarket pm = PredictionMarket(market);
        console.log("Market Owner:", pm.owner());
        console.log("Deployer is owner:", pm.owner() == deployer);

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("New Factory Address:", address(factory));
        console.log("Test Market Address:", market);
        console.log("\nUpdate frontend contracts.ts with new addresses!");
    }
}
