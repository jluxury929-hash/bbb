const { ethers } = require("ethers");
const { checkPoolLiquidity } = require("./bridgeUtils");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_SOURCE);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const TOKEN_ADDR = "0xE3BE7a547866d5BB7374689ec4d85159590e8010";

const ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)"
];

async function run() {
    console.log("-----------------------------------------");
    try {
        const contract = new ethers.Contract(TOKEN_ADDR, ABI, wallet);
        
        // 1. Get Decimals safely
        const decimals = await contract.decimals();
        
        // 2. Get your wallet balance of LGBT
        const balance = await contract.balanceOf(wallet.address);
        const readable = ethers.formatUnits(balance, decimals);
        
        console.log(`Wallet: ${wallet.address}`);
        console.log(`LGBT Balance: ${readable}`);

        // 3. Check logic (Example: move if you have more than 0 tokens)
        if (balance > 0n) {
            console.log("⚠️ Conditions met. Moving LGBT to destination...");
            const tx = await contract.transfer(process.env.DESTINATION_ADDRESS, balance);
            console.log(`✅ Success! Tx: ${tx.hash}`);
            await tx.wait();
        } else {
            console.log("Wallet is empty of LGBT.");
        }

    } catch (err) {
        console.error("❌ System Error:", err.message);
    }
}

run();
setInterval(run, 300000);
