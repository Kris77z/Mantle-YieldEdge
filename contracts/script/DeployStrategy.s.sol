// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/StrategyVault.sol";
import "../src/PredictionMarket.sol";

contract DeployStrategy is Script {
    // Current System Addresses (Mantle Sepolia)
    address constant VAULT = 0x1676614C211795e3990Df2F4d7cc028C9B347ADF;
    address constant BTC_MARKET = 0xa23e7a86B9B89f10C454D3fA59d3a81b9369456F;
    address constant MOCK_USDY = 0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Strategy Vault: "BTC Bull Run Max"
        // Target: BTC Market, Outcome: Yes (0), Lock: 30 days
        StrategyVault strategy = new StrategyVault(
            VAULT,
            BTC_MARKET,
            MOCK_USDY,
            "BTC Bull Max Strategy",
            30 days,
            PredictionMarket.Outcome.Yes
        );

        console.log("Deployed StrategyVault at:", address(strategy));
        
        vm.stopBroadcast();
    }
}
