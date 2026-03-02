const { ethers } = require("ethers");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sha256, evidenceId } = req.body || {};
    if (!sha256 || !evidenceId) {
      return res.status(400).json({ error: "sha256 and evidenceId are required" });
    }

    if (!/^[a-fA-F0-9]{64}$/.test(sha256)) {
      return res.status(400).json({ error: "Invalid sha256 format" });
    }

    const RPC_URL = process.env.SEPOLIA_RPC_URL;
    const PRIVATE_KEY = process.env.SHEILD_PRIVATE_KEY;

    if (!RPC_URL || !PRIVATE_KEY) {
      return res.status(500).json({ error: "Missing SEPOLIA_RPC_URL or SHEILD_PRIVATE_KEY" });
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // store sha256 (32 bytes) as tx data
    const data = "0x" + sha256;

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      data
    });

    const receipt = await tx.wait(1);

    return res.status(200).json({
      ok: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Notarization failed" });
  }
};
