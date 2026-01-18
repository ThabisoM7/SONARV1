const hre = require("hardhat");

async function main() {
  console.log("Deploying CR8TEMusic...");

  const CR8TEMusic = await hre.ethers.getContractFactory("CR8TEMusic");
  const contract = await CR8TEMusic.deploy();

  console.log("Deployment transaction sent:", contract.deployTransaction.hash);
  console.log("Waiting for confirmation...");

  // Support both Ethers v5 and v6 syntax just in case
  if (contract.waitForDeployment) {
    await contract.waitForDeployment();
    console.log("CR8TEMusic deployed to:", contract.target);
  } else {
    await contract.deployed();
    console.log("CR8TEMusic deployed to:", contract.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
