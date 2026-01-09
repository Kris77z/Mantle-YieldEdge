// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

interface IMockUSDY {
    function mint(address to, uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function fastForwardDays(uint256 days_) external;
}

interface IYieldVault {
    function deposit(uint256 amount) external;
    function withdraw() external;
    function getDepositInfo(address user) external view returns (
        uint256 currentValue,
        uint256 principal,
        uint256 unlockedYield,
        uint256 lockedYield
    );
    function getAvailableYield(address user) external view returns (uint256);
}

interface IMarketFactory {
    function createMarket(string memory question, uint256 duration) external returns (address);
}

interface IPredictionMarket {
    function predict(uint8 choice, uint256 yieldAmount) external;
    function closeMarket() external;
    function resolve(uint8 outcome) external;
    function claimReward() external;
    function owner() external view returns (address);
}

contract TestFullLoop is Script {
    // Deployed contract addresses on Mantle Sepolia
    address constant MOCK_USDY = 0xBBc063b260b514c569bFcC5875512A5Eaa61a438;
    address constant YIELD_VAULT = 0x29C81174e1834D80bA68838bA2510A0A8c1970e4;
    address constant MARKET_FACTORY = 0x49B30Fa07a0437491584828B3D77E7891CDecb5d;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== YieldEdge FULL Loop Test ===");
        console.log("Tester:", deployer);

        IMockUSDY usdy = IMockUSDY(MOCK_USDY);
        IYieldVault vault = IYieldVault(YIELD_VAULT);
        IMarketFactory factory = IMarketFactory(MARKET_FACTORY);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Create a new market
        console.log("\n[1] Creating new market...");
        address marketAddr = factory.createMarket("Full Loop Test Market", 1 hours);
        IPredictionMarket market = IPredictionMarket(marketAddr);
        console.log("    Market:", marketAddr);
        console.log("    Owner:", market.owner());

        // Step 2: Mint
        console.log("\n[2] Minting 1000 USDY...");
        usdy.mint(deployer, 1000 ether);
        console.log("    Balance:", usdy.balanceOf(deployer) / 1e18);

        // Step 3: Approve & Deposit
        console.log("\n[3] Depositing 500 USDY...");
        usdy.approve(YIELD_VAULT, 500 ether);
        vault.deposit(500 ether);
        _logVaultInfo(vault, deployer);

        // Step 4: Fast Forward to generate yield
        console.log("\n[4] Simulating 30 days of yield...");
        usdy.fastForwardDays(30);
        _logVaultInfo(vault, deployer);

        // Step 5: Make Prediction
        console.log("\n[5] Placing prediction...");
        uint256 availYield = vault.getAvailableYield(deployer);
        console.log("    Available yield:", availYield / 1e18);
        uint256 betAmount = availYield / 2;
        market.predict(1, betAmount); // YES
        console.log("    Bet:", betAmount / 1e18, "yield on YES");
        _logVaultInfo(vault, deployer);

        // Step 6: Close and Resolve Market
        console.log("\n[6] Closing and resolving market (YES wins)...");
        market.closeMarket();
        console.log("    Market closed");
        market.resolve(1); // YES wins
        console.log("    Market resolved: YES wins!");

        // Step 7: Claim Reward
        console.log("\n[7] Claiming reward...");
        market.claimReward();
        console.log("    Reward claimed!");
        _logVaultInfo(vault, deployer);

        // Step 8: Withdraw
        console.log("\n[8] Withdrawing...");
        vault.withdraw();
        console.log("    Final wallet balance:", usdy.balanceOf(deployer) / 1e18);
        _logVaultInfo(vault, deployer);

        vm.stopBroadcast();

        console.log("\n================================");
        console.log("=== FULL LOOP COMPLETE! ===");
        console.log("================================");
    }

    function _logVaultInfo(IYieldVault vault, address user) internal view {
        (uint256 cv, uint256 pr, uint256 uy, uint256 ly) = vault.getDepositInfo(user);
        console.log("    Vault: principal=%s, unlocked=%s, locked=%s", pr/1e18, uy/1e18, ly/1e18);
    }
}
