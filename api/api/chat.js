import Cohere from "cohere-ai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const key = process.env.COHERE_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing COHERE_API_KEY" });

    Cohere.init(key);

    const system = `
You are SHEild Legal Assistant.
Guide women facing cyber harassment in India.
Provide: (1) immediate safety steps, (2) evidence preservation steps, (3) relevant IPC/IT Act sections, (4) how to report (cybercrime.gov.in), (5) keep it concise.
No guarantees. Safety-first.
`;

    // Cohere Chat API
    const resp = await Cohere.chat({
      model: "command-r",
      message: prompt,
      preamble: system,
      temperature: 0.3
    });

    return res.status(200).json({
      ok: true,
      reply: resp?.text || "No response."
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}