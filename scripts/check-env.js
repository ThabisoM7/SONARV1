require("dotenv").config({ path: ".env.local" });

async function main() {
    const url = process.env.ALCHEMY_AMOY_URL;
    const key = process.env.PRIVATE_KEY;

    console.log("Checking Environment Variables...");

    if (!url) {
        console.error("❌ ALCHEMY_AMOY_URL is MISSING");
    } else {
        console.log(`✅ ALCHEMY_AMOY_URL found: ${url.substring(0, 10)}... (Length: ${url.length})`);
    }

    if (!key) {
        console.error("❌ PRIVATE_KEY is MISSING");
    } else {
        console.log(`✅ PRIVATE_KEY found. (Length: ${key.length})`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
