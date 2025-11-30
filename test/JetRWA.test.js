const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JetRWA Contract", function () {
  let JetRWA, jetRWA, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    JetRWA = await ethers.getContractFactory("JetRWA");
    // 1 ETH = 10^18 Wei
    jetRWA = await JetRWA.deploy("JetShare", "JET", "N999", "Bombardier");
  });

  it("Should set the correct jet details", async function () {
    expect(await jetRWA.tailNumber()).to.equal("N999");
  });

  it("Should allow buying shares and distributing revenue", async function () {
    // 1. 设置价格并开启销售
    const price = ethers.parseEther("0.1"); // 0.1 ETH per share
    await jetRWA.setSharePrice(price);
    await jetRWA.setSaleStatus(true);

    // 2. addr1 购买 10 股 (花费 1 ETH)
    await jetRWA.connect(addr1).buyShares(10, { value: ethers.parseEther("1.0") });
    expect(await jetRWA.balanceOf(addr1.address)).to.equal(10);

    // 3. 模拟产生收益 (Admin 存入 1 ETH)
    await jetRWA.depositRevenue({ value: ethers.parseEther("1.0") });

    // 4. 检查 addr1 的可领取分红 (只有他有股份，所以他应该分得全部 1 ETH)
    // 注意：由于精度问题，Solidity 可能会有微小误差，但在全部分配时通常一致
    const dividend = await jetRWA.withdrawableDividendOf(addr1.address);
    expect(dividend).to.equal(ethers.parseEther("1.0"));

    // 5. 领取分红
    await expect(jetRWA.connect(addr1).claimDividends())
      .to.changeEtherBalance(addr1, ethers.parseEther("1.0"));
  });

  it("Should record maintenance logs", async function () {
    await jetRWA.recordMaintenance("Engine Check", 5000, "GE Aviation");
    const count = await jetRWA.getMaintenanceCount();
    expect(count).to.equal(1);
    
    const log = await jetRWA.maintenanceHistory(0);
    expect(log.description).to.equal("Engine Check");
  });
});