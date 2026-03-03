export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });

    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    const { victim, incident, evidenceList } = req.body || {};
    if (!incident?.summary) {
      return res.status(400).json({ error: "incident.summary required" });
    }

    const prompt = `
Create a structured cyber harassment complaint draft for India (cybercrime portal / police complaint style).
Be factual, concise, and legally cautious. No guarantees.

Return in plain text with headings:
1. Complainant Details
2. Incident Summary
3. Timeline (if dates provided)
4. Suspect/Offender Details (if any)
5. Evidence List (with cloud link)
6. Applicable Legal Provisions (IPC/IT Act - best fit)
7. Requested Action
8. Declaration

Inputs:
Complainant:
- Name: ${victim?.name || "Not provided"}
- Phone: ${victim?.phone || "Not provided"}
- Email: ${victim?.email || "Not provided"}

Incident:
- Category: ${incident?.category || "Not provided"}
- Summary: ${incident?.summary || ""}
- Platform/App: ${incident?.platform || "Not provided"}
- Started On: ${incident?.startDate || "Not provided"}
- Last Occurred On: ${incident?.endDate || "Not provided"}
- Additional Notes: ${incident?.notes || "Not provided"}

Evidence (each item):
${(evidenceList || []).map((e, i) => `
${i + 1}) Title: ${e.title || "N/A"}
   Type: ${e.type || "N/A"}
   Cloud URL: ${e.url || "N/A"}
`).join("\n")}
`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": process.env.SITE_URL || "http://localhost",
        "X-Title": process.env.SITE_NAME || "SHEild"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You draft formal complaint text for cyber harassment cases in India. Be structured, factual, and concise." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: data?.error?.message || "OpenRouter report generation failed" });
    }

    const draft = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ ok: true, draft });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}