export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Failed to list models", raw: data });
    }

    const simplified = (data.models || []).map(m => ({
      name: m.name, // e.g. "models/gemini-1.5-flash"
      supportedGenerationMethods: m.supportedGenerationMethods || []
    }));

    return res.status(200).json({ ok: true, models: simplified });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}