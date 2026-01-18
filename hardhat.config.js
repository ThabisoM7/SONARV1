require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: (process.env.ALCHEMY_AMOY_URL || process.env.ALCHEMY_API_URL || "https://polygon-amoy.g.alchemy.com/v2/your-api-key").replace(/"/g, ''),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    artifacts: "./src/artifacts", // make artifacts accessible to Next.js
  },
};
