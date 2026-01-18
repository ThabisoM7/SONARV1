const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const url = (process.env.ALCHEMY_AMOY_URL || process.env.ALCHEMY_API_URL).replace(/"/g, '');
    const pKey = process.env.PRIVATE_KEY.replace(/"/g, '');

    console.log("🚀 Starting Manual Deployment to Amoy...");

    // 1. Setup Provider & Wallet
    // Fix for Ethers v5 (Hardhat Default)
    const provider = new ethers.providers.JsonRpcProvider(url);
    const wallet = new ethers.Wallet(pKey, provider);
    console.log("Deploying from:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.utils.formatEther(balance));

    // 2. Load Artifact
    const artifactPath = path.join(__dirname, "../src/artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json");
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found at ${artifactPath}. Run 'npx hardhat compile' first.`);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // 3. Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    console.log("Sending Deploy Transaction...");

    // Create contract with forced Gas Settings for Amoy
    const contract = await factory.deploy({
        gasLimit: 3000000,
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("25", "gwei")
    });
    console.log("Tx Hash:", contract.deployTransaction.hash);

    console.log("Waiting for confirmation...");
    await contract.deployed();

    console.log("✅ CR8TEMusic deployed to:", contract.address);
    console.log("SAVE THIS ADDRESS TO .env.local!");
}

main().catch((error) => {
    console.error("❌ DEPLOY ERROR:", error);
    process.exitCode = 1;
});
