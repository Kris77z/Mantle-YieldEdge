// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MarketFactory.sol";

contract GetMarketAddresses is Script {
    function run() external view {
        address factoryAddress = 0xd37a43d4e56Bf29ab3Cff71Fc84aD7aa7C9D724A;
        MarketFactory factory = MarketFactory(factoryAddress);
        
        address[] memory markets = factory.getAllMarkets();
        console.log("Found markets:", markets.length);
        for(uint i=0; i<markets.length; i++) {
            console.log("Market", i, ":", markets[i]);
        }
    }
}
