// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/MockMETH.sol";
import "../src/YieldVault.sol";
import "../src/MarketFactory.sol";

contract DeployMETHStack is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying mETH Stack with account:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock mETH (Simulates 4% APY)
        MockMETH meth = new MockMETH();
        console.log("MockMETH deployed at:", address(meth));

        // 2. Deploy YieldVault for mETH
        YieldVault vault = new YieldVault(address(meth));
        console.log("YieldVault (mETH) deployed at:", address(vault));

        // 3. Deploy MarketFactory linked to mETH Vault
        MarketFactory factory = new MarketFactory(address(vault));
        console.log("MarketFactory (mETH) deployed at:", address(factory));

        // 4. Authorize Factory in Vault
        vault.setAuthorizedFactory(address(factory));
        console.log("Factory authorized in mETH Vault");

        // 5. Create Sample mETH Markets
        
        // Market A: ETH Price
        address marketA = factory.createMarket("Will ETH flip BTC market cap in 2026?", 365 days);
        console.log("mETH Market A created at:", marketA);
        
        // Market B: Mantle TVL
        address marketB = factory.createMarket("Will Mantle TVL hit $5B by Q4 2026?", 300 days);
        console.log("mETH Market B created at:", marketB);

        vm.stopBroadcast();
    }
}
