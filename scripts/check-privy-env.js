require("dotenv").config({ path: ".env.local" });

console.log("Checking Privy Environment Variables...");
console.log("NEXT_PUBLIC_PRIVY_APP_ID:", process.env.NEXT_PUBLIC_PRIVY_APP_ID ? "✅ Found" : "❌ Missing");
console.log("PRIVY_APP_SECRET:", process.env.PRIVY_APP_SECRET ? "✅ Found" : "❌ Missing");

if (!process.env.PRIVY_APP_SECRET) {
    console.error("\nERROR: PRIVY_APP_SECRET is missing. The API will fail.");
    console.log("Please add it to .env.local");
} else {
    console.log("\n✅ Configuration looks correct.");
}
