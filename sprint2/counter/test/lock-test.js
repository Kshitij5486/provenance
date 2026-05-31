// test/lock-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lock contract", function () {
  // a helper that deploys a fresh Lock before each test
  async function deployLock() {
    const ONE_HOUR = 60 * 60;
    const latestBlock = await ethers.provider.getBlock("latest");
    const unlockTime = latestBlock.timestamp + ONE_HOUR;
    
    const lockedAmount = ethers.parseEther("1");

    // get the test accounts the local chain provides
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });
    await lock.waitForDeployment();

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  it("sets the right unlock time", async function () {
    const { lock, unlockTime } = await deployLock();
    expect(await lock.unlockTime()).to.equal(unlockTime);
  });

  it("sets the deployer as the owner", async function () {
    const { lock, owner } = await deployLock();
    expect(await lock.owner()).to.equal(owner.address);
  });

  it("holds the locked funds", async function () {
    const { lock, lockedAmount } = await deployLock();
    const balance = await ethers.provider.getBalance(await lock.getAddress());
    expect(balance).to.equal(lockedAmount);
  });

  it("reverts withdraw before the unlock time", async function () {
    const { lock } = await deployLock();
    await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
  });

  it("reverts withdraw if a non-owner calls it after unlock", async function () {
    const { lock, unlockTime, otherAccount } = await deployLock();
    // fast-forward the blockchain's clock past the unlock time
    await ethers.provider.send("evm_setNextBlockTimestamp", [unlockTime + 1]);
    await ethers.provider.send("evm_mine", []);
    // a different account tries to withdraw -> should hit the owner guard
    await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith("You aren't the owner");
  });

  it("lets the owner withdraw after the unlock time", async function () {
    const { lock, unlockTime, owner } = await deployLock();
    await ethers.provider.send("evm_setNextBlockTimestamp", [unlockTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(lock.connect(owner).withdraw()).to.emit(lock, "Withdrawal");
  });
});