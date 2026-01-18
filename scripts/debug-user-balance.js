const hre = require("hardhat");

async function main() {
    const address = "0x36f8C57784888b0BA57D06779E98873bA242E519";
    const provider = new hre.ethers.JsonRpcProvider(process.env.ALCHEMY_AMOY_URL || "https://rpc-amoy.polygon.technology");

    console.log(`Checking balance for: ${address}`);
    const balance = await provider.getBalance(address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} MATIC`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
