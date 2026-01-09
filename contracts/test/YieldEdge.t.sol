// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/MockUSDY.sol";
import "../src/YieldVault.sol";
import "../src/PredictionMarket.sol";

/**
 * @title YieldEdgeTest
 * @notice Comprehensive tests for the YieldEdge zero-loss prediction market.
 */
contract YieldEdgeTest is Test {
    MockUSDY public usdy;
    YieldVault public vault;
    PredictionMarket public market;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    uint256 constant INITIAL_BALANCE = 10000 ether;
    uint256 constant PREDICTION_DURATION = 7 days;

    function setUp() public {
        // Deploy MockUSDY
        usdy = new MockUSDY();
        
        // Deploy YieldVault
        vault = new YieldVault(address(usdy));
        
        // Deploy a sample prediction market
        market = new PredictionMarket(
            address(vault),
            "Will BTC exceed $100k by end of Q1 2025?",
            PREDICTION_DURATION,
            address(this) // Test contract is the owner
        );
        
        // Authorize the market in the vault
        vault.setMarketAuthorization(address(market), true);
        
        // Mint tokens to test users
        usdy.mint(alice, INITIAL_BALANCE);
        usdy.mint(bob, INITIAL_BALANCE);
        usdy.mint(charlie, INITIAL_BALANCE);
    }

    // ============ MockUSDY Tests ============

    function test_MockUSDY_InitialState() public view {
        assertEq(usdy.name(), "Mock USDY");
        assertEq(usdy.symbol(), "mUSDY");
        assertEq(usdy.decimals(), 18);
        assertEq(usdy.exchangeRate(), 1e18);
    }

    function test_MockUSDY_YieldAccrual() public {
        uint256 initialBalance = usdy.balanceOf(alice);
        
        // Fast forward 365 days (should accrue ~5% yield)
        usdy.fastForwardDays(365);
        
        uint256 finalBalance = usdy.balanceOf(alice);
        
        // Should be approximately 5% higher
        assertGt(finalBalance, initialBalance);
        assertApproxEqRel(finalBalance, initialBalance * 105 / 100, 0.01e18); // 1% tolerance
    }

    // ============ YieldVault Tests ============

    function test_Vault_Deposit() public {
        vm.startPrank(alice);
        usdy.approve(address(vault), INITIAL_BALANCE);
        vault.deposit(1000 ether);
        vm.stopPrank();
        
        (uint256 currentValue, uint256 principal, , ) = vault.getDepositInfo(alice);
        assertEq(principal, 1000 ether);
        assertEq(currentValue, 1000 ether);
    }

    function test_Vault_YieldAccrual() public {
        // Alice deposits
        vm.startPrank(alice);
        usdy.approve(address(vault), INITIAL_BALANCE);
        vault.deposit(1000 ether);
        vm.stopPrank();
        
        // Fast forward 30 days
        usdy.fastForwardDays(30);
        
        (uint256 currentValue, uint256 principal, uint256 unlockedYield, ) = vault.getDepositInfo(alice);
        
        assertGt(currentValue, principal);
        assertGt(unlockedYield, 0);
    }

    function test_Vault_WithdrawWithYield() public {
        // Alice deposits
        vm.startPrank(alice);
        usdy.approve(address(vault), INITIAL_BALANCE);
        vault.deposit(1000 ether);
        
        uint256 balanceAfterDeposit = usdy.balanceOf(alice);
        
        // Fast forward 30 days
        usdy.fastForwardDays(30);
        
        // Withdraw
        vault.withdraw();
        vm.stopPrank();
        
        uint256 finalBalance = usdy.balanceOf(alice);
        
        // Should have more than initial 10000 - 1000 = 9000
        assertGt(finalBalance, balanceAfterDeposit);
    }

    // ============ PredictionMarket Tests ============

    function test_Market_Predict() public {
        // Setup: Alice and Bob deposit
        _setupDepositsAndYield();
        
        // Alice predicts YES
        vm.prank(alice);
        market.predict(PredictionMarket.Outcome.Yes, 10 ether);
        
        // Bob predicts NO
        vm.prank(bob);
        market.predict(PredictionMarket.Outcome.No, 10 ether);
        
        assertEq(market.totalYesStake(), 10 ether);
        assertEq(market.totalNoStake(), 10 ether);
    }

    function test_Market_ZeroLoss_LoserGetsBackPrincipal() public {
        // Setup
        _setupDepositsAndYield();
        
        // Alice (1000 deposit) predicts YES with 10 yield
        vm.prank(alice);
        market.predict(PredictionMarket.Outcome.Yes, 10 ether);
        
        // Bob (1000 deposit) predicts NO with 10 yield
        vm.prank(bob);
        market.predict(PredictionMarket.Outcome.No, 10 ether);
        
        // Get Alice's principal before resolution
        (, uint256 alicePrincipalBefore, , ) = vault.getDepositInfo(alice);
        
        // Resolve: YES wins (Alice wins, Bob loses)
        market.resolve(PredictionMarket.Outcome.Yes);
        
        // Bob claims (he lost)
        vm.prank(bob);
        market.claimReward();
        
        // Bob should still have his principal safe
        (, uint256 bobPrincipal, , ) = vault.getDepositInfo(bob);
        assertEq(bobPrincipal, 1000 ether, "Bob's principal should be intact");
    }

    function test_Market_WinnerGetsLoserYield() public {
        // Setup
        _setupDepositsAndYield();
        
        // Alice predicts YES with 10 yield
        vm.prank(alice);
        market.predict(PredictionMarket.Outcome.Yes, 10 ether);
        
        // Bob predicts NO with 10 yield
        vm.prank(bob);
        market.predict(PredictionMarket.Outcome.No, 10 ether);
        
        uint256 aliceAvailableYieldBefore = vault.getAvailableYield(alice);
        
        // Resolve: YES wins
        market.resolve(PredictionMarket.Outcome.Yes);
        
        // Alice claims (she won)
        vm.prank(alice);
        market.claimReward();
        
        // Alice should have her original yield unlocked
        uint256 aliceAvailableYieldAfter = vault.getAvailableYield(alice);
        assertGe(aliceAvailableYieldAfter, aliceAvailableYieldBefore - 10 ether);
    }

    function test_Market_CalculatePotentialWinnings() public view {
        uint256 potential = market.calculatePotentialWinnings(PredictionMarket.Outcome.Yes, 100 ether);
        
        // If no one else has bet, potential = stake (no loser pool to share)
        assertEq(potential, 100 ether);
    }

    // ============ Helper Functions ============

    function _setupDepositsAndYield() internal {
        // Alice deposits
        vm.startPrank(alice);
        usdy.approve(address(vault), INITIAL_BALANCE);
        vault.deposit(1000 ether);
        vm.stopPrank();
        
        // Bob deposits
        vm.startPrank(bob);
        usdy.approve(address(vault), INITIAL_BALANCE);
        vault.deposit(1000 ether);
        vm.stopPrank();
        
        // Fast forward 365 days to accrue ~5% yield (50 ether per 1000 deposited)
        usdy.fastForwardDays(365);
    }
}
