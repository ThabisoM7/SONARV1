const hre = require("hardhat");

async function main() {
  console.log("Deploying Contract...");
  const Factory = await hre.ethers.getContractFactory("CR8TEMusic");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log("DEPLOYED_ADDRESS:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
