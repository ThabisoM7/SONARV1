const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const pKey = process.env.PRIVATE_KEY;
    const url = process.env.ALCHEMY_AMOY_URL || process.env.ALCHEMY_API_URL;

    console.log("--- DEBUG START ---");

    // 1. Check Key
    try {
        if (!pKey) throw new Error("Private Key missing env");
        const wallet = new hre.ethers.Wallet(pKey);
        console.log("✅ Wallet Address derived locally:", wallet.address);
    } catch (e) {
        console.error("❌ Key Error:", e.message);
        return;
    }

    // 2. Check Network
    console.log("Testing Provider connection...");
    try {
        const provider = new hre.ethers.JsonRpcProvider(url);
        const network = await provider.getNetwork();
        console.log("✅ Connected to Network:", network.name, "(Chain ID:", network.chainId.toString(), ")");

        const balance = await provider.getBalance(new hre.ethers.Wallet(pKey).address);
        console.log("✅ Balance:", hre.ethers.formatEther(balance), "MATIC");
    } catch (e) {
        console.error("❌ Provider/Network Error:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
