// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {YieldVault} from "./YieldVault.sol";

/**
 * @title PredictionMarket
 * @notice A zero-loss prediction market where users bet their yield, not principal.
 * @dev Users stake their accrued yield on YES or NO outcomes.
 *      Winners take all the yield from the losing side.
 *      Losers get their principal back (zero loss).
 */
contract PredictionMarket {
    // ============ Enums ============
    
    enum MarketStatus {
        Open,       // Accepting predictions
        Closed,     // No more predictions, waiting for resolution
        Resolved    // Outcome determined, rewards claimable
    }
    
    enum Outcome {
        Undecided,
        Yes,
        No
    }

    // ============ Structs ============
    
    struct Prediction {
        uint256 yieldStaked;    // Amount of yield staked
        Outcome choice;         // YES or NO
        bool claimed;           // Whether rewards have been claimed
    }

    // ============ State Variables ============
    
    /// @notice The vault contract managing deposits
    YieldVault public immutable vault;
    
    /// @notice Market metadata
    string public question;
    uint256 public createdAt;
    uint256 public closesAt;
    
    /// @notice Market state
    MarketStatus public status;
    Outcome public outcome;
    
    /// @notice Total yield staked on each side
    uint256 public totalYesStake;
    uint256 public totalNoStake;
    
    /// @notice User predictions
    mapping(address => Prediction) public predictions;
    
    /// @notice List of all predictors (for iteration if needed)
    address[] public predictors;
    
    /// @notice Market owner (can resolve the market)
    address public owner;
    
    /// @notice Oracle address (if using automated resolution)
    address public oracle;

    // ============ Events ============
    
    event PredictionMade(address indexed user, Outcome choice, uint256 amount);
    event MarketClosed();
    event MarketResolved(Outcome outcome);
    event RewardClaimed(address indexed user, uint256 reward);

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "PredictionMarket: not owner");
        _;
    }
    
    modifier onlyOpen() {
        require(status == MarketStatus.Open, "PredictionMarket: not open");
        require(block.timestamp < closesAt, "PredictionMarket: past deadline");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _vault,
        string memory _question,
        uint256 _duration,
        address _owner
    ) {
        vault = YieldVault(_vault);
        question = _question;
        createdAt = block.timestamp;
        closesAt = block.timestamp + _duration;
        status = MarketStatus.Open;
        outcome = Outcome.Undecided;
        owner = _owner;
    }

    /**
     * @notice Make a prediction by staking yield.
     * @param choice The predicted outcome (Yes or No).
     * @param yieldAmount The amount of yield to stake.
     * @dev Users can add more stake to their existing position if betting on the same side.
     *      Switching sides is not allowed.
     */
    function predict(Outcome choice, uint256 yieldAmount) external onlyOpen {
        require(choice == Outcome.Yes || choice == Outcome.No, "PredictionMarket: invalid choice");
        require(yieldAmount > 0, "PredictionMarket: zero stake");
        
        Prediction storage existing = predictions[msg.sender];
        
        // Check if user already has a position
        if (existing.yieldStaked > 0) {
            // User already predicted - only allow adding to same side
            require(existing.choice == choice, "PredictionMarket: cannot switch sides");
            
            // Lock additional yield in the vault
            vault.lockYield(msg.sender, yieldAmount);
            
            // Add to existing position
            existing.yieldStaked += yieldAmount;
            
            if (choice == Outcome.Yes) {
                totalYesStake += yieldAmount;
            } else {
                totalNoStake += yieldAmount;
            }
            
            emit PredictionMade(msg.sender, choice, yieldAmount);
        } else {
            // New prediction
            vault.lockYield(msg.sender, yieldAmount);
            
            predictions[msg.sender] = Prediction({
                yieldStaked: yieldAmount,
                choice: choice,
                claimed: false
            });
            
            predictors.push(msg.sender);
            
            if (choice == Outcome.Yes) {
                totalYesStake += yieldAmount;
            } else {
                totalNoStake += yieldAmount;
            }
            
            emit PredictionMade(msg.sender, choice, yieldAmount);
        }
    }

    /**
     * @notice Claim rewards after the market is resolved.
     * @dev Winners receive their stake back plus a share of the losing pool.
     *      Losers get nothing (but their principal in the vault is safe).
     */
    function claimReward() external {
        require(status == MarketStatus.Resolved, "PredictionMarket: not resolved");
        
        Prediction storage pred = predictions[msg.sender];
        require(pred.yieldStaked > 0, "PredictionMarket: no prediction");
        require(!pred.claimed, "PredictionMarket: already claimed");
        
        pred.claimed = true;
        
        // 1. Always unlock the user's principal stake first
        vault.unlockYield(msg.sender, pred.yieldStaked);
        
        // 2. If won, distribute reward from the Market Pool (collected in settlement)
        if (pred.choice == outcome) {
            uint256 winningPool = outcome == Outcome.Yes ? totalYesStake : totalNoStake;
            uint256 losingPool = outcome == Outcome.Yes ? totalNoStake : totalYesStake;
            
            if (losingPool > 0 && winningPool > 0) {
                // Calculate Reward: Share of the losing pool
                uint256 reward = (pred.yieldStaked * losingPool) / winningPool;
                
                // Transfer reward from Market (this) to Winner
                vault.transferYield(address(this), msg.sender, reward);
                
                emit RewardClaimed(msg.sender, pred.yieldStaked + reward);
            } else {
                emit RewardClaimed(msg.sender, pred.yieldStaked);
            }
        } else {
            // Loser: yield is forfeited (transferred to Market in settle)
            emit RewardClaimed(msg.sender, 0);
        }
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Close the market to new predictions.
     */
    function closeMarket() external onlyOwner {
        require(status == MarketStatus.Open, "PredictionMarket: not open");
        status = MarketStatus.Closed;
        emit MarketClosed();
    }

    /**
     * @notice Resolve the market with the final outcome.
     * @param _outcome The winning outcome (Yes or No).
     */
    function resolve(Outcome _outcome) external onlyOwner {
        require(status == MarketStatus.Open || status == MarketStatus.Closed, "PredictionMarket: already resolved");
        require(_outcome == Outcome.Yes || _outcome == Outcome.No, "PredictionMarket: invalid outcome");
        
        status = MarketStatus.Resolved;
        outcome = _outcome;
        
        // Settle the market: transfer yield from losers to winners
        _settleMarket();
        
        emit MarketResolved(_outcome);
    }

    function _settleMarket() internal {
        // Collect yield from losers into the Market contract
        for (uint256 i = 0; i < predictors.length; i++) {
            address predictor = predictors[i];
            Prediction storage pred = predictions[predictor];
            
            if (pred.choice != outcome) {
                // Loser: Transfer staked yield to Market (this)
                vault.transferYield(predictor, address(this), pred.yieldStaked);
                
                // Lock it in Market so it can be transferred later via transferYield
                // (transferYield requires source to be locked)
                vault.lockYield(address(this), pred.yieldStaked);
            }
        }
    }

    // ============ View Functions ============
    
    /**
     * @notice Get market summary.
     * @return _question The market question.
     * @return _status Current status.
     * @return _outcome Current outcome (if resolved).
     * @return _totalYes Total yield staked on YES.
     * @return _totalNo Total yield staked on NO.
     * @return _closesAt Deadline for predictions.
     */
    function getMarketInfo() external view returns (
        string memory _question,
        MarketStatus _status,
        Outcome _outcome,
        uint256 _totalYes,
        uint256 _totalNo,
        uint256 _closesAt
    ) {
        return (question, status, outcome, totalYesStake, totalNoStake, closesAt);
    }

    /**
     * @notice Get the number of predictors.
     * @return The count of unique predictors.
     */
    function getPredictorCount() external view returns (uint256) {
        return predictors.length;
    }

    /**
     * @notice Calculate potential winnings for a hypothetical stake.
     * @param choice The outcome to bet on.
     * @param amount The amount to stake.
     * @return The potential total return (stake + winnings) if this side wins.
     */
    function calculatePotentialWinnings(Outcome choice, uint256 amount) external view returns (uint256) {
        uint256 newWinningPool = choice == Outcome.Yes 
            ? totalYesStake + amount 
            : totalNoStake + amount;
        uint256 losingPool = choice == Outcome.Yes ? totalNoStake : totalYesStake;
        
        if (newWinningPool == 0) return amount;
        
        uint256 share = (amount * losingPool) / newWinningPool;
        return amount + share;
    }
}
