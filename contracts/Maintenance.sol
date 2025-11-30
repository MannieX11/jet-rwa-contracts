// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ownership.sol";

abstract contract Maintenance is Ownership {
    struct MaintenanceLog {
        uint256 timestamp;
        string description;
        uint256 cost;
        string serviceProvider;
    }

    MaintenanceLog[] public maintenanceHistory;

    event MaintenanceRecorded(uint256 indexed id, string description, uint256 cost);

    // 记录新的检修
    function recordMaintenance(
        string memory _description, 
        uint256 _cost, 
        string memory _serviceProvider
    ) external onlyOwner {
        maintenanceHistory.push(MaintenanceLog({
            timestamp: block.timestamp,
            description: _description,
            cost: _cost,
            serviceProvider: _serviceProvider
        }));

        emit MaintenanceRecorded(maintenanceHistory.length - 1, _description, _cost);
    }

    // 获取检修记录总数
    function getMaintenanceCount() external view returns (uint256) {
        return maintenanceHistory.length;
    }
}