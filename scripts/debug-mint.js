require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting Debug Mint...");

    // 1. Setup
    const url = process.env.ALCHEMY_AMOY_URL || process.env.ALCHEMY_API_URL;
    const pKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    const provider = new ethers.JsonRpcProvider(url);
    const wallet = new ethers.Wallet(pKey, provider);

    console.log("Wallet:", wallet.address);
    console.log("Contract:", contractAddress);

    // 2. Artifact
    const artifactPath = path.join(__dirname, "../src/artifacts/contracts/CR8TEMusic.sol/CR8TEMusic.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

    // 3. Mint
    const uri = "ipfs://QmDebugMint";
    const fee = 500;
    const receiver = wallet.address;

    console.log(`Minting: URI=${uri}, Fee=${fee}, Receiver=${receiver}`);

    // Estimate Gas first
    try {
        const gasEstimate = await contract.mintTrack.estimateGas(uri, fee, receiver);
        console.log("Gas Estimate:", gasEstimate.toString());
    } catch (e) {
        console.error("❌ Gas Estimation Failed:", e);
        // We will try to force it anyway
    }

    try {
        const feeData = await provider.getFeeData();
        // Aggressive Gas
        const tx = await contract.mintTrack(uri, fee, receiver, {
            gasLimit: 500000,
            maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas * 2n : undefined,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 2n : undefined,
        });

        console.log("Tx Sent:", tx.hash);
        await tx.wait();
        console.log("✅ Mint Successful!");
    } catch (e) {
        console.error("❌ Mint Failed:", e);
    }
}

main();
