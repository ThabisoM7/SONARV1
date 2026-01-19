const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const provider = new hre.ethers.JsonRpcProvider(process.env.ALCHEMY_AMOY_URL || "https://rpc-amoy.polygon.technology");

    // Create wallet from Private Key in .env.local
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ No PRIVATE_KEY found in .env.local");
        return;
    }

    const wallet = new hre.ethers.Wallet(privateKey, provider);
    console.log("---------------------------------------------------");
    console.log("🔑 Wallet Configured in .env.local");
    console.log("---------------------------------------------------");
    console.log("📍 Address:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC");
    console.log("---------------------------------------------------");

    if (balance > hre.ethers.parseEther("0.1")) {
        console.log("✅ Sufficient funds for deployment!");
    } else {
        console.log("❌ INSUFFICIENT FUNDS. Please send at least 0.2 MATIC to the address above.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
