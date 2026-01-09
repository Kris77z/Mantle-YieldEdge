// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/YieldVault.sol";
import "../src/PredictionMarket.sol";
import "../src/MockUSDY.sol";

contract SimulateLifecycle is Script {
    // New System Addresses (Deployed Step 2663)
    address constant VAULT = 0x1676614C211795e3990Df2F4d7cc028C9B347ADF;
    address constant ETH_MARKET = 0x01C1Dde2fb525e76Dc353775B4afeeB4cae99503;
    address constant MOCK_USDY = 0xA54D4Ff2A4eFfbc3b4C725d869d602bc794DADE7;
    
    // Actors
    uint256 ownerPk;
    address owner;
    
    // Simulating a Loser
    uint256 loserPk = 0xBEEF; 
    address loser;

    function run() external {
        ownerPk = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(ownerPk);
        loser = vm.addr(loserPk);

        YieldVault vault = YieldVault(VAULT);
        PredictionMarket market = PredictionMarket(ETH_MARKET);
        MockUSDY usdy = MockUSDY(MOCK_USDY);

        console.log("--------------- SIMULATION START ---------------");
        console.log("Market:", market.question());
        
        // ---------------------------------------------------------
        // Step 1: Setup Loser (The Counterparty)
        // ---------------------------------------------------------
        vm.startBroadcast(ownerPk);
        // Mint funds for loser if needed
        if (usdy.balanceOf(loser) < 10000 ether) {
            usdy.mint(loser, 10000 ether);
            // Transfer some ETH for gas
            payable(loser).transfer(0.1 ether);
        }
        vm.stopBroadcast();

        vm.startBroadcast(loserPk);
        console.log("\n[Loser Action]");
        if (vault.getAvailableYield(loser) < 50 ether) {
            usdy.approve(address(vault), 5000 ether);
            vault.flashDeposit(5000 ether, 30 days);
        }
        
        uint256 loserYield = vault.getAvailableYield(loser);
        console.log("Loser Available Yield:", loserYield / 1e18);
        
        // Loser bets NO (Outcome 1)
        uint256 betAmount = 50 ether;
        // Check if market allows betting (open)
        ( , PredictionMarket.MarketStatus status, , , , ) = market.getMarketInfo();
        if (status == PredictionMarket.MarketStatus.Open) {
             try market.predict(PredictionMarket.Outcome.No, betAmount) {
                 console.log("Loser Bet 50 yUSDY on NO");
             } catch Error(string memory reason) {
                 console.log("Loser Bet Failed:", reason);
             }
        }
        vm.stopBroadcast();

        // ---------------------------------------------------------
        // Step 2: Setup Winner (You / Owner)
        // ---------------------------------------------------------
        vm.startBroadcast(ownerPk);
        console.log("\n[Winner (You) Action]");
        
        if (vault.getAvailableYield(owner) < 50 ether) {
            usdy.approve(address(vault), 5000 ether);
            vault.flashDeposit(5000 ether, 30 days); 
            console.log("Winner Flash Deposited 5000 USDY");
        }
        
        // Winner bets YES (Outcome 0)
        try market.predict(PredictionMarket.Outcome.Yes, betAmount) {
            console.log("Winner Bet 50 yUSDY on YES");
        } catch Error(string memory reason) {
            console.log("Winner Bet Failed (Maybe already bet?):", reason);
        }
        
        // ---------------------------------------------------------
        // Step 3: Resolution
        // ---------------------------------------------------------
        console.log("\n[Oracle Resolution]");
        // Check current status
        ( , status, , , , ) = market.getMarketInfo();
        if (status != PredictionMarket.MarketStatus.Resolved) {
            market.resolve(PredictionMarket.Outcome.Yes);
            console.log("Market Resolved to: YES");
        } else {
            console.log("Market Already Resolved");
        }
        
        // ---------------------------------------------------------
        // Step 4: Claim & Verify
        // ---------------------------------------------------------
        console.log("\n[Claiming Reward]");
        
        uint256 yieldBefore = vault.getAvailableYield(owner);
        ( , uint256 principalBefore, , ) = vault.getDepositInfo(owner);
        
        try market.claimReward() {
            console.log("Winner Claimed Successfully!");
        } catch Error(string memory reason) {
            console.log("Claim Failed:", reason);
        }
        
        uint256 yieldAfter = vault.getAvailableYield(owner);
        ( , uint256 principalAfter, , ) = vault.getDepositInfo(owner);
        
        console.log("---------------- RESULTS ------------------");
        console.log("Principal Before:", principalBefore / 1e18);
        console.log("Principal After: ", principalAfter / 1e18);
        
        if (principalBefore == principalAfter) {
            console.log("SUCCESS: Principal is 100% Protected! (Zero Loss)");
        } else {
            console.log("FAILURE: Principal changed!");
        }

        console.log("Yield Balance Before Claim:", yieldBefore / 1e18);
        console.log("Yield Balance After Claim: ", yieldAfter / 1e18);
        console.log("Net Profit:", (yieldAfter - yieldBefore) / 1e18);
        
        vm.stopBroadcast();
        console.log("-------------------------------------------");
    }
}
