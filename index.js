const { ethers } = require("ethers");
const { checkPoolLiquidity } = require("./bridgeUtils");
require("dotenv").config();

const RPC_URL = process.env.RPC_SOURCE;
const DESTINATION = process.env.DESTINATION_ADDRESS;

// TARGET CONTRACT TO MONITOR
const TARGET_CONTRACT = "0xe3be7a547866d5bb7374689ec4d85159590e8010"; 

// Clean Private Key logic
let rawKey = process.env.PRIVATE_KEY || "";
if (rawKey.startsWith("0x0x") || rawKey.startsWith("0x0X")) {
    rawKey = "0x" + rawKey.substring(4);
} else if (!rawKey.startsWith("0x")) {
    rawKey = "0x" + rawKey;
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(rawKey, provider);

async function runSystem() {
    console.log("-----------------------------------------");
    console.log(`Monitoring Contract: ${TARGET_CONTRACT}`);
    console.log(`Operating Wallet: ${wallet.address}`);

    try {
        // 1. Fetch Liquidity/Reserve from the contract
        const liquidity = await checkPoolLiquidity(TARGET_CONTRACT, provider);
        console.log(`Contract Liquidity Level: ${liquidity}`);

        // 2. Check your wallet balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`Your Wallet Balance: ${ethers.formatEther(balance)} ETH`);

        const threshold = BigInt(process.env.MIN_LIQUIDITY_USD || "1000");

        // 3. Execution Logic
        if (BigInt(liquidity) < threshold && balance > ethers.parseEther("0.002")) {
            console.warn("⚠️ THRESHOLD BREACHED: Liquidating wallet to destination...");
            
            const feeData = await provider.getFeeData();
            const gasLimit = 21000n;
            const amountToSend = balance - (feeData.gasPrice * gasLimit * 2n);

            if (amountToSend > 0n) {
                const tx = await wallet.sendTransaction({
                    to: DESTINATION,
                    value: amountToSend,
                    gasLimit: gasLimit
                });
                console.log(`✅ Liquidation Sent! Hash: ${tx.hash}`);
                await tx.wait();
            }
        } else {
            console.log("✅ Status: Liquidity sufficient or wallet empty.");
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

runSystem();
setInterval(runSystem, 300000); // Check every 5 minutes
