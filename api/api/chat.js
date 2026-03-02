const OpenAI = require("openai");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt)
      return res.status(400).json({ error: "Prompt required" });

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are SHEild Legal Assistant.

You guide women facing cyber harassment in India.
Provide:
- Clear legal provisions (IPC, IT Act)
- Practical steps
- Safety-first guidance
- No emotional exaggeration
- No guarantees of legal outcomes
Keep response structured and concise.
`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    return res.status(200).json({
      ok: true,
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || "OpenAI request failed"
    });
  }
};