const { ethers } = require("ethers");

async function checkPoolLiquidity(contractAddress, provider) {
    try {
        const abi = [
            "function totalSupply() view returns (uint256)",
            "function balanceOf(address) view returns (uint256)"
        ];
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        // We monitor the total supply or a specific reserve. 
        // For LGBT, we'll return total supply as a health metric.
        const supply = await contract.totalSupply();
        return supply.toString();
    } catch (e) {
        console.error("Error reading contract data:", e.message);
        return "0";
    }
}

module.exports = { checkPoolLiquidity };
