const hre = require("hardhat");

async function main() {
    console.log("Deploying SocialGraph contract...");

    const socialGraph = await hre.ethers.deployContract("SocialGraph");

    await socialGraph.waitForDeployment();

    const address = await socialGraph.getAddress();

    console.log(`SocialGraph deployed to: ${address}`);
    console.log("Don't forget to update your .env and frontend constants!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
