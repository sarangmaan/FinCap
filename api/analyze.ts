import Groq from 'groq-sdk';

const MODEL_NAME = 'llama-3.3-70b-versatile';

const JSON_SYSTEM_PROMPT = `
You are a Senior Investment Banker. 
Return valid JSON ONLY. No markdown.
Schema:
{
  "riskScore": number,
  "bubbleProbability": number,
  "marketSentiment": "Bullish" | "Bearish" | "Neutral" | "Euphoric",
  "keyMetrics": [{ "label": string, "value": string }],
  "technicalAnalysis": {
    "priceData": [{ "date": "YYYY-MM-DD", "price": number, "ma50": number }],
    "rsiData": [{ "date": "string", "value": number }],
    "currentRsi": number,
    "currentMa": number,
    "signal": "string"
  },
  "bubbleAudit": {
    "riskStatus": "string",
    "valuationVerdict": "string",
    "score": number,
    "fundamentals": "string",
    "peerContext": "string",
    "speculativeActivity": "string",
    "burstTrigger": "string",
    "liquidityStatus": "string"
  },
  "swot": {
    "strengths": [string],
    "weaknesses": [string],
    "opportunities": [string],
    "threats": [string]
  },
  "whistleblower": {
    "integrityScore": number,
    "forensicVerdict": string,
    "anomalies": [string],
    "insiderDetails": [string]
  },
  "topBubbleAssets": [{
    "name": string, 
    "riskScore": number, 
    "sector": string, 
    "price": string, 
    "reason": string
  }]
}
`;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { mode, data } = req.body;
    const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Server Config Error: GROQ_API_KEY is missing.' });

    const groq = new Groq({ apiKey });

    if (mode === 'chat') {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are 'The Reality Check'." },
                ... (payload.history || []).map((h: any) => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
                { role: "user", content: payload.message || '' }
            ],
            model: MODEL_NAME,
            max_tokens: 200,
        });
        return res.status(200).send(completion.choices[0]?.message?.content);
    }

    let userPrompt = "";
    if (mode === 'market') userPrompt = `Analyze: ${data}`;
    else if (mode === 'portfolio') userPrompt = `Audit portfolio: ${data}`;
    else if (mode === 'bubbles') userPrompt = `Scan bubbles.`;

    const jsonCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: JSON_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        model: MODEL_NAME,
        response_format: { type: "json_object" },
        temperature: 0.1
    });

    const structuredData = JSON.parse(jsonCompletion.choices[0]?.message?.content || "{}");
    
    // Backfill
    if (structuredData.technicalAnalysis?.priceData) {
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map((p: any) => ({
            label: p.date,
            value: p.price,
            ma50: p.ma50
        }));
    }

    const reportCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are a Wall Street Analyst. Write a Markdown summary." },
            { role: "user", content: `Data: ${JSON.stringify(structuredData)}` }
        ],
        model: MODEL_NAME,
    });

    return res.status(200).json({
        markdownReport: reportCompletion.choices[0]?.message?.content || "Done.",
        structuredData
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}