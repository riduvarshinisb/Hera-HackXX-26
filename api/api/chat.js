import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const system = `
You are SHEild Legal Assistant.
Guide women facing cyber harassment in India.
Provide:
- Practical safety steps
- Relevant IPC and IT Act sections
- Clear structured answer
- No guarantees of outcomes
Keep responses concise and actionable.
`;

    const result = await model.generateContent([
      system,
      `User: ${prompt}`
    ]);

    const reply = result?.response?.text?.() || "";

    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}