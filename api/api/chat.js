import cohere from "cohere-ai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    if (!process.env.COHERE_API_KEY) {
      return res.status(500).json({ error: "Missing COHERE_API_KEY" });
    }

    cohere.init(process.env.COHERE_API_KEY);

    const system = `You are SHEild Legal Assistant. Guide women facing cyber harassment in India. Give: safety steps, evidence preservation, relevant IPC/IT Act sections, and how to report. No guarantees. Be concise.`;

    const resp = await cohere.chat({
      model: "command-r",
      message: prompt,
      preamble: system,
      temperature: 0.3
    });

    return res.status(200).json({ ok: true, reply: resp?.text || "" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}