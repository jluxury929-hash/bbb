const { ethers } = require("ethers");
const { checkPoolLiquidity } = require("./bridgeUtils");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_SOURCE);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// The Token Contract Address from your .env
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const TARGET_POOL = "0xe3be7a547866d5bb7374689ec4d85159590e8010";

// Minimal ABI to check balance and transfer tokens
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
];

async function runSystem() {
    try {
        console.log("-----------------------------------------");
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
        
        // 1. Get Token Data
        const decimals = await tokenContract.decimals();
        const balance = await tokenContract.balanceOf(wallet.address);
        const readableBalance = ethers.formatUnits(balance, decimals);
        
        console.log(`Monitoring Token: ${TOKEN_ADDRESS}`);
        console.log(`Your Token Balance: ${readableBalance}`);

        // 2. Check Pool Liquidity
        const liquidity = await checkPoolLiquidity(TARGET_POOL, provider);
        console.log(`Pool Liquidity: ${liquidity}`);

        // 3. Logic
        if (BigInt(liquidity) < BigInt(process.env.MIN_LIQUIDITY_USD)) {
            if (balance > 0n) {
                console.warn("⚠️ Liquidity low! Moving tokens...");
                const tx = await tokenContract.transfer(process.env.DESTINATION_ADDRESS, balance);
                console.log(`✅ Tokens Sent! Hash: ${tx.hash}`);
                await tx.wait();
            } else {
                console.log("❌ No tokens found in wallet to move.");
            }
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

runSystem();
setInterval(runSystem, 300000);
