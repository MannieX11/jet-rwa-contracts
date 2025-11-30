const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 参数：名称，代号，尾号，制造商
  const jetRWA = await hre.ethers.deployContract("JetRWA", [
    "Gulfstream G650 Share", 
    "G650-RWA", 
    "N888JQ", 
    "Gulfstream"
  ]);

  await jetRWA.waitForDeployment();

  console.log("JetRWA deployed to:", jetRWA.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});