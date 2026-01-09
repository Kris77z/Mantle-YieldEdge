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

contract TestVaultLoop is Script {
    // Deployed contract addresses on Mantle Sepolia
    address constant MOCK_USDY = 0xBBc063b260b514c569bFcC5875512A5Eaa61a438;
    address constant YIELD_VAULT = 0x29C81174e1834D80bA68838bA2510A0A8c1970e4;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== YieldEdge VAULT Loop Test ===");
        console.log("Tester:", deployer);

        IMockUSDY usdy = IMockUSDY(MOCK_USDY);
        IYieldVault vault = IYieldVault(YIELD_VAULT);

        // Check initial state
        console.log("\n[0] Initial State");
        console.log("    Wallet USDY:", usdy.balanceOf(deployer) / 1e18);
        _logVaultInfo(vault, deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Mint
        console.log("\n[1] Minting 1000 USDY...");
        usdy.mint(deployer, 1000 ether);
        console.log("    Balance:", usdy.balanceOf(deployer) / 1e18);

        // Step 2: Approve & Deposit
        console.log("\n[2] Depositing 500 USDY...");
        usdy.approve(YIELD_VAULT, 500 ether);
        vault.deposit(500 ether);
        _logVaultInfo(vault, deployer);

        // Step 3: Fast Forward Time (30 days)
        console.log("\n[3] Simulating 30 days...");
        usdy.fastForwardDays(30);
        _logVaultInfo(vault, deployer);

        // Step 4: Withdraw (no locked yield, should work)
        console.log("\n[4] Withdrawing everything...");
        vault.withdraw();
        console.log("    Final wallet balance:", usdy.balanceOf(deployer) / 1e18);
        _logVaultInfo(vault, deployer);

        vm.stopBroadcast();

        console.log("\n==============================");
        console.log("=== VAULT LOOP COMPLETE! ===");
        console.log("==============================");
    }

    function _logVaultInfo(IYieldVault vault, address user) internal view {
        (uint256 cv, uint256 pr, uint256 uy, uint256 ly) = vault.getDepositInfo(user);
        console.log("    Vault: principal=%s, unlocked=%s, locked=%s", pr/1e18, uy/1e18, ly/1e18);
    }
}
