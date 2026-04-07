export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  }

  const { today, dailyHours, subjects } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `학습플래너AI. 오늘${today}.${dailyHours}\n${subjects}\n규칙:역산배분,균등,직전3일복습(premium:true),구체적,id고유\nJSON만:{"plan":[{"date":"...","dayLabel":"D-N","tasks":[{"id":"t1","subject":"...","task":"...","duration":"1.5시간","done":false,"premium":false}]}]}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.content
      .map((c) => c.text || "")
      .join("")
      .replace(/```json\s?|```/g, "")
      .trim();

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
