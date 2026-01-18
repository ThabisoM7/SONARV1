require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. Setup Provider & Wallet
    const url = process.env.ALCHEMY_API_URL || process.env.ALCHEMY_AMOY_URL;
    const pKey = process.env.PRIVATE_KEY;

    if (!url || !pKey) {
        console.error("Missing ALCHEMY_URL or PRIVATE_KEY");
        process.exit(1);
    }

    // Ethers v6 Provider Syntax
    const provider = new ethers.JsonRpcProvider(url);
    const wallet = new ethers.Wallet(pKey, provider);
    console.log("🚀 Deploying from:", wallet.address);
    console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)));

    // 2. Read Artifacts
    const artifactPath = path.join(__dirname, "../src/artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json");
    if (!fs.existsSync(artifactPath)) {
        console.error("Artifact not found:", artifactPath);
        process.exit(1);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // 3. Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Manual Gas Settings for Amoy
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ? feeData.gasPrice * 5n : undefined; // 5x gas price for reliability?

    console.log("Deploying contract...");
    const contract = await factory.deploy({
        gasLimit: 3000000,
        // Ethers v6 uses maxFeePerGas / maxPriorityFeePerGas automatically if EIP-1559, but simple deploy is safer
    });

    console.log("Waiting for deployment...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("✅ CR8TEMusic Deployed to:", address);

    // Update .env.local
    const envPath = path.join(__dirname, "../.env.local");
    const envContent = fs.readFileSync(envPath, "utf8");
    const newEnvContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`
    );
    fs.writeFileSync(envPath, newEnvContent);
    console.log("Updated .env.local");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
