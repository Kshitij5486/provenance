// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // 1 hour from now, in seconds (for the unlock time)
  const unlockTime = Math.floor(Date.now() / 1000) + 3600;

  // amount of ETH to lock in the contract at deployment (1 ETH)
  const lockedAmount = hre.ethers.parseEther("1");

  // get the contract "factory" — a helper that knows how to deploy Lock
  const Lock = await hre.ethers.getContractFactory("Lock");

  // deploy it: pass the constructor arg (unlockTime) and send 1 ETH along
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  // wait until the deployment is mined into the blockchain
  await lock.waitForDeployment();

  console.log("Lock deployed to address:", await lock.getAddress());
  console.log("Unlock time set to:", unlockTime);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});