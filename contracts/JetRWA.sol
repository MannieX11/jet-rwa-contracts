// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Ownership.sol";
import "./Maintenance.sol";
import "./ShareManagement.sol";
import "./RevenueDistribution.sol";

// 修复点：调整了继承顺序
// 之前的错误顺序：is ERC20, Ownership...
// 正确的顺序：is Ownership, Maintenance, ERC20, ShareManagement, RevenueDistribution
// 逻辑：基础权限(Ownership) -> 基础业务(Maintenance) -> 代币标准(ERC20) -> 扩展代币业务(Share/Revenue)
contract JetRWA is Ownership, Maintenance, ERC20, ShareManagement, RevenueDistribution {
    
    string public tailNumber; 
    string public manufacturer;

    constructor(
        string memory _name, 
        string memory _symbol,
        string memory _tailNumber,
        string memory _manufacturer
    ) ERC20(_name, _symbol) {
        tailNumber = _tailNumber;
        manufacturer = _manufacturer;
    }

    // 重写函数也需要保持顺序
    // 注意：ShareManagement 没有重写 _update，所以这里只需要 override(ERC20, RevenueDistribution)
    function _update(address from, address to, uint256 value) internal override(ERC20, RevenueDistribution) {
        super._update(from, to, value);
    }
}