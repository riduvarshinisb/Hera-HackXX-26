export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });

    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        // Recommended by OpenRouter for analytics/rate-limits:
        "HTTP-Referer": process.env.SITE_URL || "http://localhost",
        "X-Title": process.env.SITE_NAME || "SHEild"
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are SHEild Legal Assistant. Provide India cyber harassment guidance: practical steps + relevant IPC/IT Act sections. Safety-first. No guarantees. Keep concise."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        error: data?.error?.message || data?.error || "OpenRouter request failed"
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}