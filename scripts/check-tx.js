const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

const TX_HASH = "0x074a75a8e50ac666863c5eb58f3e0d793a222796d10d0044b0276dd2b837706a";

async function main() {
    const url = (process.env.ALCHEMY_AMOY_URL || process.env.ALCHEMY_API_URL).replace(/"/g, '');
    const provider = new ethers.providers.JsonRpcProvider(url);

    console.log("Checking TX:", TX_HASH);

    try {
        console.log("Querying receipt...");
        const receipt = await provider.getTransactionReceipt(TX_HASH);

        if (receipt) {
            console.log("✅ Transaction Mined!");
            console.log("Contract Address:", receipt.contractAddress);
        } else {
            console.log("⚠️ Receipt is null. Transaction might still be pending or network is slow.");
        }
    } catch (e) {
        console.error("❌ Error checking TX:", e);
    }
}

main();
