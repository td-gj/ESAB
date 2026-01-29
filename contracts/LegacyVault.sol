// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LegacyVault
 * @dev Multi-user inheritance vault (dead man's switch): Users create vaults, deposit assets, add heirs.
 *      Heirs can claim shares if owner is inactive for a set period (30-365 days).
 *      Supports native ETH and ERC20 tokens.
 */
contract LegacyVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============= Constants =============
    uint256 private constant MIN_INACTIVITY_PERIOD = 30 days;
    uint256 private constant MAX_INACTIVITY_PERIOD = 365 days;
    uint256 private constant MAX_HEIRS = 50;

    // ============= Structs =============
    struct HeirInfo {
        uint256 points;
        bool claimed;
    }

    struct VaultData {
        uint256 inactivityPeriod;
        uint256 lastActivity;
        bool initialized;
        uint256 ethBalance;
        address[] heirsList;
        uint256 totalPoints;
        mapping(address => HeirInfo) heirs;
        mapping(address => uint256) heirIndex;
        mapping(address => uint256) tokenBalances;
    }

    // ============= State Variables =============
    mapping(address => VaultData) public vaults;
    address[] public vaultOwners;

    // ============= Events =============
    event VaultCreated(address indexed owner, uint256 inactivityPeriod);
    event DepositETH(address indexed owner, uint256 amount, uint256 newBalance);
    event WithdrawETH(address indexed owner, uint256 amount, uint256 newBalance);
    event DepositERC20(address indexed owner, address indexed token, uint256 amount, uint256 newBalance);
    event WithdrawERC20(address indexed owner, address indexed token, uint256 amount, uint256 newBalance);
    event HeirAdded(address indexed owner, address indexed heir, uint256 points, uint256 totalPoints);
    event HeirRemoved(address indexed owner, address indexed heir, uint256 points, uint256 totalPoints);
    event Claimed(address indexed owner, address indexed heir, address indexed token, uint256 amount);
    event ActivityReset(address indexed owner, uint256 timestamp);

    // ============= Modifiers =============
    modifier onlyVaultOwner(address _owner) {
        require(msg.sender == _owner, "Only vault owner");
        _;
    }

    modifier onlyInitialized(address _owner) {
        require(vaults[_owner].initialized, "Vault not initialized");
        _;
    }

    // ============= Vault Creation =============
    function createVault(uint256 _inactivityPeriod) external {
        require(!vaults[msg.sender].initialized, "Vault already exists");
        require(
            _inactivityPeriod >= MIN_INACTIVITY_PERIOD && _inactivityPeriod <= MAX_INACTIVITY_PERIOD,
            "Invalid inactivity period"
        );

        VaultData storage vault = vaults[msg.sender];
        vault.inactivityPeriod = _inactivityPeriod;
        vault.lastActivity = block.timestamp;
        vault.initialized = true;
        vault.ethBalance = 0;
        vault.totalPoints = 0;

        vaultOwners.push(msg.sender);

        emit VaultCreated(msg.sender, _inactivityPeriod);
    }

    // ============= Deposit Functions =============
    function depositETH(address _vaultOwner) external payable onlyInitialized(_vaultOwner) {
        require(msg.value > 0, "Amount must be > 0");

        VaultData storage vault = vaults[_vaultOwner];
        vault.ethBalance += msg.value;
        vault.lastActivity = block.timestamp;

        emit DepositETH(_vaultOwner, msg.value, vault.ethBalance);
    }

    function depositERC20(address _vaultOwner, address token, uint256 amount) external onlyInitialized(_vaultOwner) {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        VaultData storage vault = vaults[_vaultOwner];
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        vault.tokenBalances[token] += amount;
        vault.lastActivity = block.timestamp;

        emit DepositERC20(_vaultOwner, token, amount, vault.tokenBalances[token]);
    }

    // ============= Withdrawal Functions =============
    function withdrawETH(uint256 amount) external onlyVaultOwner(msg.sender) onlyInitialized(msg.sender) {
        require(amount > 0, "Amount must be > 0");

        VaultData storage vault = vaults[msg.sender];
        require(amount <= vault.ethBalance, "Insufficient balance");

        vault.ethBalance -= amount;
        vault.lastActivity = block.timestamp;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit WithdrawETH(msg.sender, amount, vault.ethBalance);
    }

    function withdrawERC20(address token, uint256 amount) external onlyVaultOwner(msg.sender) onlyInitialized(msg.sender) {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        VaultData storage vault = vaults[msg.sender];
        require(amount <= vault.tokenBalances[token], "Insufficient balance");

        vault.tokenBalances[token] -= amount;
        vault.lastActivity = block.timestamp;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit WithdrawERC20(msg.sender, token, amount, vault.tokenBalances[token]);
    }

    // ============= Heir Management =============
    function addHeir(address _vaultOwner, address heir, uint256 points) external onlyVaultOwner(_vaultOwner) onlyInitialized(_vaultOwner) {
        require(heir != address(0), "Invalid heir");
        require(heir != _vaultOwner, "Owner cannot be heir");
        require(points > 0, "Points must be > 0");

        VaultData storage vault = vaults[_vaultOwner];
        require(vault.heirsList.length < MAX_HEIRS, "Max heirs reached");

        if (vault.heirIndex[heir] == 0) {
            vault.heirsList.push(heir);
            vault.heirIndex[heir] = vault.heirsList.length;
        }

        vault.heirs[heir].points = points;
        vault.totalPoints += points;

        vault.lastActivity = block.timestamp;

        emit HeirAdded(_vaultOwner, heir, points, vault.totalPoints);
    }

    function removeHeir(address _vaultOwner, address heir) external onlyVaultOwner(_vaultOwner) onlyInitialized(_vaultOwner) {
        VaultData storage vault = vaults[_vaultOwner];
        uint256 idx = vault.heirIndex[heir];
        require(idx > 0, "Heir not found");

        uint256 points = vault.heirs[heir].points;
        vault.totalPoints -= points;

        address lastHeir = vault.heirsList[vault.heirsList.length - 1];
        vault.heirsList[idx - 1] = lastHeir;
        vault.heirIndex[lastHeir] = idx;
        vault.heirsList.pop();

        delete vault.heirs[heir];
        delete vault.heirIndex[heir];

        vault.lastActivity = block.timestamp;

        emit HeirRemoved(_vaultOwner, heir, points, vault.totalPoints);
    }

    // ============= Ping Function =============
    function ping(address _vaultOwner) external onlyVaultOwner(_vaultOwner) onlyInitialized(_vaultOwner) {
        vaults[_vaultOwner].lastActivity = block.timestamp;
        emit ActivityReset(_vaultOwner, block.timestamp);
    }

    // ============= Claim Functions =============
    function claimETH(address _vaultOwner) external nonReentrant {
        VaultData storage vault = vaults[_vaultOwner];
        require(vault.initialized, "Vault not initialized");
        require(block.timestamp >= vault.lastActivity + vault.inactivityPeriod, "Owner still active");

        HeirInfo storage heirInfo = vault.heirs[msg.sender];
        require(heirInfo.points > 0, "Not an heir");
        require(!heirInfo.claimed, "Already claimed");

        uint256 share = (vault.ethBalance * heirInfo.points) / vault.totalPoints;
        require(share > 0, "No claimable amount");

        heirInfo.claimed = true;
        vault.ethBalance -= share;

        (bool success, ) = msg.sender.call{value: share}("");
        require(success, "Transfer failed");

        emit Claimed(_vaultOwner, msg.sender, address(0), share);
    }

    function claimERC20(address _vaultOwner, address token) external nonReentrant {
        require(token != address(0), "Invalid token");

        VaultData storage vault = vaults[_vaultOwner];
        require(vault.initialized, "Vault not initialized");
        require(block.timestamp >= vault.lastActivity + vault.inactivityPeriod, "Owner still active");

        HeirInfo storage heirInfo = vault.heirs[msg.sender];
        require(heirInfo.points > 0, "Not an heir");
        require(!heirInfo.claimed, "Already claimed");

        uint256 tokenBalance = vault.tokenBalances[token];
        uint256 share = (tokenBalance * heirInfo.points) / vault.totalPoints;
        require(share > 0, "No claimable amount");

        heirInfo.claimed = true;
        vault.tokenBalances[token] -= share;

        IERC20(token).safeTransfer(msg.sender, share);

        emit Claimed(_vaultOwner, msg.sender, token, share);
    }

    // ============= View Functions =============
    function getVault(address _owner) external view returns (
        uint256 inactivityPeriod,
        uint256 lastActivity,
        bool initialized,
        uint256 ethBalance,
        uint256 totalPoints,
        uint256 heirsCount
    ) {
        VaultData storage vault = vaults[_owner];
        return (
            vault.inactivityPeriod,
            vault.lastActivity,
            vault.initialized,
            vault.ethBalance,
            vault.totalPoints,
            vault.heirsList.length
        );
    }

    function getHeirsCount(address _owner) external view returns (uint256) {
        return vaults[_owner].heirsList.length;
    }

    function getHeirAt(address _owner, uint256 index) external view returns (address) {
        return vaults[_owner].heirsList[index];
    }

    function getHeirInfo(address _owner, address heir) external view returns (uint256 points, bool claimed) {
        HeirInfo storage heirInfo = vaults[_owner].heirs[heir];
        return (heirInfo.points, heirInfo.claimed);
    }

    function getTokenBalance(address _owner, address token) external view returns (uint256) {
        return vaults[_owner].tokenBalances[token];
    }

    function getVaultOwnersCount() external view returns (uint256) {
        return vaultOwners.length;
    }

    function getVaultOwnerAt(uint256 index) external view returns (address) {
        return vaultOwners[index];
    }

    receive() external payable {}
}
