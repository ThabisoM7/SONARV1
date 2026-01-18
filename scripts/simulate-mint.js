const hre = require("hardhat");

async function main() {
    const contractAddress = "0xB72c653F28B07be21F82B67DaF0c8599b87CB909";
    const userAddress = "0x36f8C57784888b0BA57D06779E98873bA242E519";

    // Args
    const tokenURI = "ipfs://QmdN3ryWWteS1ZnvbCJKxBZoPwudNpckdnhshi7KVPDrtK";
    const royaltyFee = 500;
    const royaltyReceiver = userAddress;

    const CR8TEMusic = await hre.ethers.getContractFactory("CR8TEMusic");
    const contract = CR8TEMusic.attach(contractAddress);

    // Impersonate the user if testing on a fork (not possible on live net without key)
    // For live net, we just callStatic from a random signer or just usage provider.call
    // But since we want to see if it reverts for THIS user:

    console.log("Simulating mint call...");

    try {
        // We can't really "impersonate" on live testnet easily without the key, 
        // but we can estimate gas from that address using `from` override.
        // If it reverts, estimateGas throws.

        // Note: We need a signer to send/estimate, even if 'from' is different,
        // actually estimateGas allows 'from'.

        // Using a random provider signer
        const [signer] = await hre.ethers.getSigners();

        const estimatedGas = await contract.mintTrack.estimateGas(
            tokenURI,
            royaltyFee,
            royaltyReceiver,
            { from: userAddress } // Simulate coming from the user
        );

        console.log(`Gas Estimation Success: ${estimatedGas}`);
    } catch (e) {
        console.error("Simulation Failed!");
        // Extract reason
        if (e.data) {
            // Try decoding
            try {
                const decoded = contract.interface.parseError(e.data);
                console.log("Revert Reason (Decoded):", decoded);
            } catch {
                console.log("Revert Data:", e.data);
            }
        } else {
            console.log("Error Message:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
