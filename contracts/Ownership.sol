// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Ownership is Ownable {
    // 白名单映射
    mapping(address => bool) public isWhitelisted;

    event WhitelistUpdated(address indexed user, bool status);

    // OpenZeppelin v5 需要在构造函数中传入 initialOwner
    constructor() Ownable(msg.sender) {}

    function setWhitelist(address _user, bool _status) external onlyOwner {
        isWhitelisted[_user] = _status;
        emit WhitelistUpdated(_user, _status);
    }

    modifier onlyWhitelisted() {
        // 修复点：这里必须用中括号 [] 访问映射，而不是圆括号 ()
        require(isWhitelisted[msg.sender], "Ownership: Caller is not whitelisted");
        _;
    }
}