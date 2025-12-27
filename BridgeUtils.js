const { ethers } = require("ethers");

async function checkPoolLiquidity(contractAddress, provider) {
    try {
        const code = await provider.getCode(contractAddress);
        if (code === "0x") return "0";

        // Try standard Uniswap V3 Liquidity first
        try {
            const v3Abi = ["function liquidity() view returns (uint128)"];
            const v3Contract = new ethers.Contract(contractAddress, v3Abi, provider);
            const liq = await v3Contract.liquidity();
            return liq.toString();
        } catch (e) {
            // Fallback: Check the ETH balance of the contract itself as a liquidity measure
            const contractBalance = await provider.getBalance(contractAddress);
            return contractBalance.toString();
        }
    } catch (err) {
        return "0";
    }
}

module.exports = { checkPoolLiquidity };
