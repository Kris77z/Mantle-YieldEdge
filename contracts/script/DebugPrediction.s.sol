// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";
import "../src/YieldVault.sol";

contract DebugPrediction is Script {
    // ETH Market Address from Config
    address constant MARKET = 0x09BBc94350e6755b9af899b5326bED04FcbBe65D;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        PredictionMarket market = PredictionMarket(MARKET);
        YieldVault vault = market.vault();
        
        console.log("----------------------------------------");
        console.log("Debug Prediction Script");
        console.log("User/Deployer:", deployer);
        console.log("Market:", address(market));
        console.log("Vault:", address(vault));
        console.log("Timestamp:", block.timestamp);
        
        // Check Markets Authorization
        bool authorized = vault.authorizedMarkets(address(market));
        console.log("Market Authorized:", authorized);
        
        // Check User Yield
        uint256 available = vault.getAvailableYield(deployer);
        console.log("Available Yield:", available);
        
        console.log("Attempting to predict 45 yUSDY on ETH Market...");
        
        try market.predict(PredictionMarket.Outcome.Yes, 45 ether) {
            console.log("SUCCESS: Prediction Placed!");
        } catch Error(string memory reason) {
            console.log("FAILURE (Revert String):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("FAILURE (Low Level Bytes)");
            if (lowLevelData.length > 0) {
                 console.logBytes(lowLevelData);
            }
        }

        vm.stopBroadcast();
        console.log("----------------------------------------");
    }
}
