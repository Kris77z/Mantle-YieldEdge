// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MockUSDY.sol";

contract MintTokens is Script {
    address constant MOCK_USDY = 0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7;
    // User Address from Screenshot/Logs
    address constant USER = 0xC438Fa8069269668417A2157fed6e501e1224014;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MockUSDY usdy = MockUSDY(MOCK_USDY);
        
        console.log("Minting 10,000 MockUSDY to:", USER);
        usdy.mint(USER, 10000 ether);
        
        console.log("New Balance:", usdy.balanceOf(USER));

        vm.stopBroadcast();
    }
}
