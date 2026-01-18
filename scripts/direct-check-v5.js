const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const url = (process.env.ALCHEMY_AMOY_URL || process.env.ALCHEMY_API_URL).replace(/"/g, '');
    const pKey = process.env.PRIVATE_KEY.replace(/"/g, '');

    console.log("Testing Direct Connection (Ethers v5)...");

    try {
        // Ethers v5 Syntax
        const provider = new ethers.providers.JsonRpcProvider(url);
        const network = await provider.getNetwork();
        console.log("✅ Network:", network.name, network.chainId.toString());

        const wallet = new ethers.Wallet(pKey, provider);
        console.log("Wallet:", wallet.address);

        const balance = await provider.getBalance(wallet.address);
        console.log("✅ Balance:", ethers.utils.formatEther(balance), "MATIC");

        if (balance.eq(0)) {
            console.error("❌ ERROR: Balance is 0.");
        }
    } catch (e) {
        console.error("❌ CONNECTION ERROR:", e);
    }
}

main();
