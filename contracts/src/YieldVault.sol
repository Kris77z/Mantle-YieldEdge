// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "lib/forge-std/src/interfaces/IERC20.sol";

/**
 * @title YieldVault
 * @notice Core vault contract for the YieldEdge zero-loss prediction market.
 * @dev Manages user deposits of yield-bearing assets and tracks principal vs. accrued yield.
 * 
 * Key Concepts:
 * - Principal: The original amount deposited by the user (always protected).
 * - Yield: The interest earned on the principal (used as prediction stakes).
 * - When a user deposits, we record their "principal" and the current exchange rate.
 * - The difference between current value and principal = claimable yield.
 */
contract YieldVault {
    // ============ Structs ============
    
    struct UserDeposit {
        uint256 shares;              // Shares in the underlying yield asset
        uint256 principalValue;      // Original value at deposit time (in asset units)
        uint256 depositTime;         // Timestamp of deposit
        uint256 lockedYield;         // Yield locked for active predictions
        uint256 flashFloor;          // Amount of yield advanced upfront
        uint256 unlockTime;          // Timestamp when principal unlocks
    }

    // ============ State Variables ============
    
    /// @notice The yield-bearing asset (e.g., MockUSDY, real USDY, or mETH)
    IERC20 public immutable asset;
    
    /// @notice Interface for getting the exchange rate from the yield asset
    IYieldAsset public immutable yieldAsset;
    
    /// @notice User deposits
    mapping(address => UserDeposit) public deposits;
    
    /// @notice Total shares in the vault
    uint256 public totalShares;
    
    /// @notice Authorized market contracts that can lock/unlock yield
    mapping(address => bool) public authorizedMarkets;
    
    /// @notice Authorized factory contract that can authorize markets
    address public authorizedFactory;
    
    /// @notice Owner of the vault
    address public owner;

    // ============ Events ============
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 principal, uint256 yield);
    event YieldLocked(address indexed user, uint256 amount, address indexed market);
    event YieldUnlocked(address indexed user, uint256 amount, address indexed market);
    event MarketAuthorized(address indexed market, bool authorized);
    event FactoryAuthorized(address indexed factory);
    event FlashDeposited(address indexed user, uint256 amount, uint256 flashYield, uint256 unlockTime);

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "YieldVault: not owner");
        _;
    }
    
    modifier onlyOwnerOrFactory() {
        require(msg.sender == owner || msg.sender == authorizedFactory, "YieldVault: not authorized");
        _;
    }
    
    modifier onlyAuthorizedMarket() {
        require(authorizedMarkets[msg.sender], "YieldVault: not authorized market");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _asset) {
        asset = IERC20(_asset);
        yieldAsset = IYieldAsset(_asset);
        owner = msg.sender;
    }

    // ============ User Functions ============
    
    /**
     * @notice Deposit yield-bearing assets into the vault.
     * @param amount The amount of assets to deposit.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "YieldVault: zero amount");
        
        // Transfer assets from user
        require(asset.transferFrom(msg.sender, address(this), amount), "YieldVault: transfer failed");
        
        // Calculate shares based on current exchange rate
        uint256 rate = yieldAsset.exchangeRate();
        uint256 shares = (amount * 1e18) / rate;
        
        // Update user deposit
        UserDeposit storage userDeposit = deposits[msg.sender];
        userDeposit.shares += shares;
        userDeposit.principalValue += amount;
        if (userDeposit.depositTime == 0) {
            userDeposit.depositTime = block.timestamp;
        }
        
        totalShares += shares;
        
        emit Deposited(msg.sender, amount, shares);
    }

    /**
     * @notice Withdraw all assets (principal + unlocked yield) from the vault.
     * @dev User cannot withdraw if they have yield locked in active predictions.
     */
    function withdraw() external {
        UserDeposit storage userDeposit = deposits[msg.sender];
        require(userDeposit.shares > 0, "YieldVault: no deposit");
        require(userDeposit.lockedYield == 0, "YieldVault: yield locked in prediction");
        require(block.timestamp >= userDeposit.unlockTime, "YieldVault: locked for flash yield");
        
        uint256 shares = userDeposit.shares;
        uint256 principal = userDeposit.principalValue;
        
        // Calculate current value
        uint256 rate = yieldAsset.exchangeRate();
        uint256 currentValue = (shares * rate) / 1e18;
        uint256 yieldEarned = currentValue > principal ? currentValue - principal : 0;
        
        // Reset user deposit
        delete deposits[msg.sender];
        totalShares -= shares;
        
        // Transfer assets back to user
        require(asset.transfer(msg.sender, currentValue), "YieldVault: transfer failed");
        
        emit Withdrawn(msg.sender, principal, yieldEarned);
    }

    /**
     * @notice Deposit assets and lock them to receive upfront yield (Flash Yield).
     * @param amount The amount to deposit.
     * @param duration The duration to lock the assets (in seconds).
     */
    function flashDeposit(uint256 amount, uint256 duration) external {
        require(amount > 0, "YieldVault: zero amount");
        require(duration >= 1 days, "YieldVault: duration too short"); 
        
        // Transfer assets
        require(asset.transferFrom(msg.sender, address(this), amount), "YieldVault: transfer failed");
        
        uint256 rate = yieldAsset.exchangeRate();
        uint256 shares = (amount * 1e18) / rate;
        
        // Calculate Flash Yield (Assuming 50% APY fixed for V1 Demo)
        uint256 flashAmount = (amount * 50e16 * duration) / (365 days * 1e18);
        
        // Update user deposit
        UserDeposit storage userDeposit = deposits[msg.sender];
        userDeposit.shares += shares;
        userDeposit.principalValue += amount;
        if (userDeposit.depositTime == 0) {
            userDeposit.depositTime = block.timestamp;
        }
        
        // Apply Flash Logic
        userDeposit.flashFloor += flashAmount;
        uint256 newUnlock = block.timestamp + duration;
        if (newUnlock > userDeposit.unlockTime) {
            userDeposit.unlockTime = newUnlock;
        }
        
        totalShares += shares;
        
        emit Deposited(msg.sender, amount, shares);
        emit FlashDeposited(msg.sender, amount, flashAmount, newUnlock);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get the current value of a user's deposit.
     * @param user The user address.
     * @return currentValue The total current value (principal + yield).
     * @return principal The original principal amount.
     * @return unlockedYield The yield available for predictions.
     * @return lockedYield The yield already locked in predictions.
     */
    function getDepositInfo(address user) external view returns (
        uint256 currentValue,
        uint256 principal,
        uint256 unlockedYield,
        uint256 lockedYield
    ) {
        UserDeposit storage userDeposit = deposits[user];
        if (userDeposit.shares == 0) {
            return (0, 0, 0, 0);
        }
        
        uint256 rate = yieldAsset.exchangeRate();
        currentValue = (userDeposit.shares * rate) / 1e18;
        principal = userDeposit.principalValue;
        lockedYield = userDeposit.lockedYield;
        
        uint256 totalYield = currentValue > principal ? currentValue - principal : 0;
        unlockedYield = totalYield > lockedYield ? totalYield - lockedYield : 0;
    }

    /**
     * @notice Get the available yield for a user to use in predictions.
     * @param user The user address.
     * @return The available yield amount.
     */
    function getAvailableYield(address user) external view returns (uint256) {
        UserDeposit storage userDeposit = deposits[user];
        if (userDeposit.shares == 0) {
            return userDeposit.flashFloor;
        }
        
        uint256 rate = yieldAsset.exchangeRate();
        uint256 currentValue = (userDeposit.shares * rate) / 1e18;
        uint256 accrued = currentValue > userDeposit.principalValue 
            ? currentValue - userDeposit.principalValue 
            : 0;
            
        uint256 totalYield = accrued > userDeposit.flashFloor ? accrued : userDeposit.flashFloor;
        
        return totalYield > userDeposit.lockedYield 
            ? totalYield - userDeposit.lockedYield 
            : 0;
    }

    // ============ Market Functions ============
    
    /**
     * @notice Lock a portion of a user's yield for a prediction.
     * @dev Only callable by authorized market contracts.
     * @param user The user whose yield to lock.
     * @param amount The amount of yield to lock.
     */
    function lockYield(address user, uint256 amount) external onlyAuthorizedMarket {
        UserDeposit storage userDeposit = deposits[user];
        
        uint256 rate = yieldAsset.exchangeRate();
        uint256 currentValue = (userDeposit.shares * rate) / 1e18;
        uint256 accrued = currentValue > userDeposit.principalValue 
            ? currentValue - userDeposit.principalValue 
            : 0;
            
        // Fix: Use flashFloor if accrued yield is not enough (Flash Yield support)
        uint256 totalYield = accrued > userDeposit.flashFloor ? accrued : userDeposit.flashFloor;
        uint256 availableYield = totalYield > userDeposit.lockedYield 
            ? totalYield - userDeposit.lockedYield 
            : 0;
        
        require(amount <= availableYield, "YieldVault: insufficient yield");
        
        userDeposit.lockedYield += amount;
        
        emit YieldLocked(user, amount, msg.sender);
    }

    /**
     * @notice Unlock a portion of a user's yield after a prediction resolves.
     * @dev Only callable by authorized market contracts.
     * @param user The user whose yield to unlock.
     * @param amount The amount of yield to unlock.
     */
    function unlockYield(address user, uint256 amount) external onlyAuthorizedMarket {
        UserDeposit storage userDeposit = deposits[user];
        require(userDeposit.lockedYield >= amount, "YieldVault: insufficient locked yield");
        
        userDeposit.lockedYield -= amount;
        
        emit YieldUnlocked(user, amount, msg.sender);
    }

    /**
     * @notice Transfer locked yield from loser to winner after prediction resolves.
     * @dev Only callable by authorized market contracts.
     * @param from The loser's address.
     * @param to The winner's address.
     * @param amount The amount of yield to transfer.
     */
    function transferYield(address from, address to, uint256 amount) external onlyAuthorizedMarket {
        UserDeposit storage fromDeposit = deposits[from];
        UserDeposit storage toDeposit = deposits[to];
        
        require(fromDeposit.lockedYield >= amount, "YieldVault: insufficient locked yield");
        
        // Calculate shares to transfer based on current rate
        uint256 rate = yieldAsset.exchangeRate();
        uint256 sharesToTransfer = (amount * 1e18 + rate - 1) / rate;
        
        require(fromDeposit.shares >= sharesToTransfer, "YieldVault: insufficient shares");
        
        // Transfer shares (the yield portion)
        fromDeposit.shares -= sharesToTransfer;
        fromDeposit.lockedYield -= amount;
        
        toDeposit.shares += sharesToTransfer;
        
        // Note: Winner's principal doesn't change, only their shares increase
        // This means their "yield" calculation will show the transferred amount
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Authorize or deauthorize a market contract.
     * @dev Can be called by owner or authorized factory.
     * @param market The market contract address.
     * @param authorized Whether to authorize or deauthorize.
     */
    function setMarketAuthorization(address market, bool authorized) external onlyOwnerOrFactory {
        authorizedMarkets[market] = authorized;
        emit MarketAuthorized(market, authorized);
    }
    
    /**
     * @notice Set the authorized factory contract.
     * @param factory The factory contract address.
     */
    function setAuthorizedFactory(address factory) external onlyOwner {
        authorizedFactory = factory;
        emit FactoryAuthorized(factory);
    }
}

// ============ Interface ============

interface IYieldAsset {
    function exchangeRate() external view returns (uint256);
}
