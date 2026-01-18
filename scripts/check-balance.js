const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "MATIC");

    if (balance === 0n) {
        console.error("❌ ERROR: Balance is 0. You need Amoy MATIC to deploy.");
    } else {
        console.log("✅ Ready to deploy.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
