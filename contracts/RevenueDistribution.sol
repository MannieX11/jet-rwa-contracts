// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ownership.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract RevenueDistribution is Ownership, ERC20 {
    uint256 public totalDividends;
    uint256 private constant MAGNITUDE = 2**128;
    uint256 private magnifiedDividendPerShare;
    
    mapping(address => int256) private magnifiedDividendCorrections;
    mapping(address => uint256) public withdrawnDividends;

    event DividendsDeposited(address indexed from, uint256 amount);
    event DividendsClaimed(address indexed by, uint256 amount);

    // 接收收益（例如飞机租赁收入），这里以 ETH 为例，也可以改为 USDT
    receive() external payable {
        if (msg.value > 0) {
            distributeDividends(msg.value);
        }
    }

    function distributeDividends(uint256 amount) internal {
        require(totalSupply() > 0, "No shares to distribute to");
        magnifiedDividendPerShare += (amount * MAGNITUDE) / totalSupply();
        totalDividends += amount;
        emit DividendsDeposited(msg.sender, amount);
    }

    // 手动存入收益功能
    function depositRevenue() external payable onlyOwner {
        distributeDividends(msg.value);
    }

    // 查询可领取的收益
    function withdrawableDividendOf(address _owner) public view returns (uint256) {
        return accumulativeDividendOf(_owner) - withdrawnDividends[_owner];
    }

    function accumulativeDividendOf(address _owner) internal view returns (uint256) {
        return uint256(int256(magnifiedDividendPerShare * balanceOf(_owner)) + magnifiedDividendCorrections[_owner]) / MAGNITUDE;
    }

    // 领取收益
    function claimDividends() external {
        uint256 _withdrawable = withdrawableDividendOf(msg.sender);
        require(_withdrawable > 0, "No dividends to claim");

        withdrawnDividends[msg.sender] += _withdrawable;
        (bool success, ) = payable(msg.sender).call{value: _withdrawable}("");
        require(success, "Transfer failed");

        emit DividendsClaimed(msg.sender, _withdrawable);
    }

    // 重写 ERC20 的转账逻辑，以修正分红权益
    function _update(address from, address to, uint256 value) internal virtual override {
        super._update(from, to, value);

        if (from != address(0)) {
            magnifiedDividendCorrections[from] += int256(magnifiedDividendPerShare * value);
        }
        if (to != address(0)) {
            magnifiedDividendCorrections[to] -= int256(magnifiedDividendPerShare * value);
        }
    }
}