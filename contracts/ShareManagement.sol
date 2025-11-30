// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ownership.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract ShareManagement is Ownership, ERC20 {
    uint256 public sharePrice; // 单价（以 wei 为单位）
    bool public isSaleOpen;

    event SharesPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event SharePriceUpdated(uint256 newPrice);

    function setSharePrice(uint256 _price) external onlyOwner {
        sharePrice = _price;
        emit SharePriceUpdated(_price);
    }

    function setSaleStatus(bool _isOpen) external onlyOwner {
        isSaleOpen = _isOpen;
    }

    // 用户购买份额
    function buyShares(uint256 shareAmount) external payable {
        require(isSaleOpen, "Sale is closed");
        require(sharePrice > 0, "Price not set");
        
        uint256 cost = shareAmount * sharePrice;
        require(msg.value >= cost, "Insufficient funds sent");

        _mint(msg.sender, shareAmount);
        
        // 退还多余的 ETH
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit SharesPurchased(msg.sender, shareAmount, cost);
    }

    // 管理员可以直接增发给特定投资人（线下打款场景）
    function mintShares(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}