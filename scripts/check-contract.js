const hre = require("hardhat");

async function main() {
    const address = "0xB72c653F28B07be21F82B67DaF0c8599b87CB909";
    const provider = new hre.ethers.JsonRpcProvider(process.env.ALCHEMY_AMOY_URL || "https://rpc-amoy.polygon.technology");

    console.log(`Checking code at: ${address}`);
    const code = await provider.getCode(address);
    console.log(`Code Length: ${code.length}`);

    if (code === "0x") {
        console.log("ERROR: No contract found at this address on Amoy!");
    } else {
        console.log("Success: Contract exists.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
