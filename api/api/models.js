import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();

    // return only useful fields
    const simplified = (models.models || []).map(m => ({
      name: m.name,                    // e.g. "models/gemini-1.5-flash"
      displayName: m.displayName,
      supportedGenerationMethods: m.supportedGenerationMethods
    }));

    return res.status(200).json({ ok: true, models: simplified });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Failed to list models" });
  }
}