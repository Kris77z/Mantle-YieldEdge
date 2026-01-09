// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MockUSDY
 * @notice A mock implementation of Ondo's USDY token that simulates yield accrual.
 * @dev For hackathon demo purposes only. Simulates ~5% APY by rebasing.
 *      In production, this would be replaced with actual USDY integration.
 * 
 * Yield Mechanism:
 * - Uses a "rebase" model where the exchange rate increases over time.
 * - `balanceOf()` returns: shares * exchangeRate
 * - Exchange rate grows by ~0.0137% per day (~5% APY)
 */
contract MockMETH {
    string public name = "Mock mETH";
    string public symbol = "mETH";
    uint8 public decimals = 18;
    
    // Precision for exchange rate calculations (18 decimals)
    uint256 public constant PRECISION = 1e18;
    
    // Starting exchange rate: 1 share = 1 mETH
    uint256 public exchangeRate = PRECISION;
    
    // Last time the exchange rate was updated
    uint256 public lastUpdateTime;
    
    // Annual yield rate in basis points (400 = 4%) - Typical ETH Staking APY
    uint256 public constant ANNUAL_YIELD_BPS = 400;
    
    // Mapping from address to shares (internal accounting)
    mapping(address => uint256) private _shares;
    
    // Allowances
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Total shares issued
    uint256 private _totalShares;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Updates the exchange rate based on time elapsed.
     * @dev Called before any transfer/balance operation to ensure accurate yield calculation.
     */
    function accrueYield() public {
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        if (timeElapsed > 0) {
            // Calculate yield: rate * (1 + APY * timeElapsed / SECONDS_PER_YEAR)
            // APY = 4% = 0.04 = 400 / 10000
            uint256 yieldAccrued = (exchangeRate * ANNUAL_YIELD_BPS * timeElapsed) / (10000 * 365 days);
            exchangeRate += yieldAccrued;
            lastUpdateTime = block.timestamp;
        }
    }

    /**
     * @notice Mint mETH tokens to an address (for testing/faucet purposes).
     * @param to The recipient address.
     * @param amount The amount of mETH to mint (in token units, not shares).
     */
    function mint(address to, uint256 amount) external {
        accrueYield();
        uint256 sharesToMint = (amount * PRECISION) / exchangeRate;
        _shares[to] += sharesToMint;
        _totalShares += sharesToMint;
        emit Transfer(address(0), to, amount);
    }

    /**
     * @notice Returns the mETH balance of an account (including accrued yield).
     * @param account The address to query.
     * @return The mETH balance.
     */
    function balanceOf(address account) public view returns (uint256) {
        // Simulate yield accrual without state change for view function
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        uint256 currentRate = exchangeRate;
        if (timeElapsed > 0) {
            uint256 yieldAccrued = (exchangeRate * ANNUAL_YIELD_BPS * timeElapsed) / (10000 * 365 days);
            currentRate += yieldAccrued;
        }
        return (_shares[account] * currentRate) / PRECISION;
    }

    /**
     * @notice Returns the shares held by an account (internal accounting).
     * @param account The address to query.
     * @return The number of shares.
     */
    function sharesOf(address account) external view returns (uint256) {
        return _shares[account];
    }

    /**
     * @notice Returns the total supply of mETH (including accrued yield).
     * @return The total mETH supply.
     */
    function totalSupply() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        uint256 currentRate = exchangeRate;
        if (timeElapsed > 0) {
            uint256 yieldAccrued = (exchangeRate * ANNUAL_YIELD_BPS * timeElapsed) / (10000 * 365 days);
            currentRate += yieldAccrued;
        }
        return (_totalShares * currentRate) / PRECISION;
    }

    /**
     * @notice Transfer mETH tokens to another address.
     * @param to The recipient address.
     * @param amount The amount of mETH to transfer.
     * @return True if successful.
     */
    function transfer(address to, uint256 amount) public returns (bool) {
        accrueYield();
        uint256 sharesToTransfer = (amount * PRECISION) / exchangeRate;
        require(_shares[msg.sender] >= sharesToTransfer, "MockMETH: insufficient balance");
        _shares[msg.sender] -= sharesToTransfer;
        _shares[to] += sharesToTransfer;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @notice Transfer mETH tokens from one address to another.
     * @param from The sender address.
     * @param to The recipient address.
     * @param amount The amount of mETH to transfer.
     * @return True if successful.
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        accrueYield();
        
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "MockMETH: insufficient allowance");
        _allowances[from][msg.sender] = currentAllowance - amount;
        
        uint256 sharesToTransfer = (amount * PRECISION) / exchangeRate;
        require(_shares[from] >= sharesToTransfer, "MockMETH: insufficient balance");
        _shares[from] -= sharesToTransfer;
        _shares[to] += sharesToTransfer;
        emit Transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Approve spender to transfer tokens.
     * @param spender The address allowed to spend.
     * @param amount The amount allowed.
     * @return True if successful.
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Get the allowance for a spender.
     * @param owner The token owner.
     * @param spender The spender address.
     * @return The remaining allowance.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @notice Burn mETH tokens from the caller's account.
     * @param amount The amount of mETH to burn.
     */
    function burn(uint256 amount) external {
        accrueYield();
        uint256 sharesToBurn = (amount * PRECISION) / exchangeRate;
        require(_shares[msg.sender] >= sharesToBurn, "MockMETH: insufficient balance");
        _shares[msg.sender] -= sharesToBurn;
        _totalShares -= sharesToBurn;
        emit Transfer(msg.sender, address(0), amount);
    }

    // ============ Fast Forward (Testing Only) ============

    /**
     * @notice Fast forwards time simulation for testing purposes.
     * @dev Only for testing! Simulates `days_` days of yield accrual.
     * @param days_ Number of days to fast forward.
     */
    function fastForwardDays(uint256 days_) external {
        uint256 yieldAccrued = (exchangeRate * ANNUAL_YIELD_BPS * days_ * 1 days) / (10000 * 365 days);
        exchangeRate += yieldAccrued;
        lastUpdateTime = block.timestamp;
    }
}
