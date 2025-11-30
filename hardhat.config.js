require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // 可以在这里配置 Sepolia 或 Mainnet
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};