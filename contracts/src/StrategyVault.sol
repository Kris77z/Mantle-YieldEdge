// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./YieldVault.sol";
import "./PredictionMarket.sol";
import {IERC20} from "lib/forge-std/src/interfaces/IERC20.sol";

/**
 * @title StrategyVault
 * @notice A structured product that automates Flash Yield strategies.
 * @dev Users deposit assets, and the vault automatically flash-deposits and bets on a specific outcome.
 *      "Don't Bet, Just Invest."
 */
contract StrategyVault {
    // Core Components
    YieldVault public immutable vault;
    PredictionMarket public immutable market;
    IERC20 public immutable asset;

    // Strategy Configuration
    uint256 public immutable lockDuration; // e.g., 30 days
    PredictionMarket.Outcome public immutable targetOutcome; // e.g., Yes (Bullish)
    string public name;

    // State
    uint256 public totalShares;

    // User State
    struct UserStrategyPosition {
        uint256 principalStaked; 
        uint256 sharesMinted;    
    }
    mapping(address => UserStrategyPosition) public positions;

    // Events
    event StrategyDeposited(address indexed user, uint256 amount);
    event StrategyWithdrawn(address indexed user, uint256 amount, uint256 yieldEarned);

    constructor(
        address _vault,
        address _market,
        address _asset,
        string memory _name,
        uint256 _lockDuration,
        PredictionMarket.Outcome _outcome
    ) {
        vault = YieldVault(_vault);
        market = PredictionMarket(_market);
        asset = IERC20(_asset);
        name = _name;
        lockDuration = _lockDuration;
        targetOutcome = _outcome;
    }

    /**
     * @notice One-click "Invest". Deposits asset, locks for yield, places bet.
     * @param amount The amount of principal to invest.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "StrategyVault: zero amount");

        // 1. Pull Asset from User
        require(asset.transferFrom(msg.sender, address(this), amount), "StrategyVault: transfer failed");

        // 2. Approve YieldVault
        asset.approve(address(vault), amount);

        // 3. Flash Deposit into YieldVault
        vault.flashDeposit(amount, lockDuration);

        // 4. Calculate Generated Flash Yield
        uint256 availableYield = vault.getAvailableYield(address(this));
        
        // 5. Place the Bet (Strategy Execution)
        if (availableYield > 0) {
            ( , PredictionMarket.MarketStatus status, , , , ) = market.getMarketInfo();
            if (status == PredictionMarket.MarketStatus.Open) {
                market.predict(targetOutcome, availableYield);
            }
        }

        // 6. Record User Position
        positions[msg.sender].principalStaked += amount;
        positions[msg.sender].sharesMinted += amount; 
        totalShares += amount;

        emit StrategyDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw principal and rewards after resolution/unlock.
     * @dev Pulls funds from YieldVault if not already pulled, then distributes to user.
     */
    function withdraw() external {
        UserStrategyPosition storage pos = positions[msg.sender];
        require(pos.principalStaked > 0, "StrategyVault: no position");

        uint256 userShares = pos.sharesMinted;
        
        // 1. Try to Claim Rewards (if any)
        ( , PredictionMarket.MarketStatus status, , , , ) = market.getMarketInfo();
        if (status == PredictionMarket.MarketStatus.Resolved) {
            try market.claimReward() {} catch {}
        }

        // 2. Check if funds are in YieldVault and pull them if possible
        (uint256 vaultValue, , , ) = vault.getDepositInfo(address(this));
        if (vaultValue > 0) {
            // Funds are in YieldVault. Try to withdraw ALL.
            // This will revert if lock duration hasn't passed.
            vault.withdraw(); 
        }

        // 3. Calculate User's Share of Total Assets held by this contract
        uint256 totalAssets = asset.balanceOf(address(this));
        require(totalAssets > 0, "StrategyVault: no assets available");

        // Share = (UserShares / TotalShares) * TotalAssets
        uint256 payout = (userShares * totalAssets) / totalShares;

        // 4. Update State BEFORE Transfer (Chefs kiss)
        pos.principalStaked = 0;
        pos.sharesMinted = 0;
        totalShares -= userShares; // Remove shares from circulation
        
        // 5. Transfer
        require(asset.transfer(msg.sender, payout), "StrategyVault: transfer failed");
        
        // Yield = Payout - Principal (if any)
        uint256 yieldEarned = 0;
        if (payout > userShares) {
            yieldEarned = payout - userShares;
        }
        
        emit StrategyWithdrawn(msg.sender, userShares, yieldEarned);
    }
}
