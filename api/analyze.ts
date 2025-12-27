import Groq from 'groq-sdk';

const MODEL_NAME = 'llama-3.3-70b-versatile';

// --- FALLBACK DATA ---
const FALLBACK_DATA = {
  riskScore: 50,
  bubbleProbability: 50,
  marketSentiment: "Neutral",
  keyMetrics: [{ label: "Status", value: "Fallback Data" }],
  technicalAnalysis: {
    priceData: [],
    rsiData: [],
    currentRsi: 50,
    currentMa: 0,
    signal: "Neutral"
  },
  bubbleAudit: {
    riskStatus: "Elevated",
    valuationVerdict: "Fair Value",
    score: 50,
    fundamentals: "Data unavailable",
    peerContext: "Unavailable",
    speculativeActivity: "Moderate",
    burstTrigger: "None",
    liquidityStatus: "Neutral"
  },
  swot: {
    strengths: ["System Active"],
    weaknesses: ["AI Connection Failed"],
    opportunities: ["Retry"],
    threats: ["Data Gaps"]
  },
  whistleblower: {
    integrityScore: 100,
    forensicVerdict: "Safe",
    anomalies: [],
    insiderDetails: []
  },
  topBubbleAssets: []
};

// --- SYSTEM PROMPT ---
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

function extractJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch(e2) {}
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch(e3) {}
    }
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { mode, data } = req.body;
    const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Server Config Error: GROQ_API_KEY is missing.' });

    const groq = new Groq({ apiKey });

    if (mode === 'chat') {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const history = payload.history || [];
        const message = payload.message || '';
        
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are 'The Reality Check'. Keep it brief." },
                ...history.map((h: any) => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
                { role: "user", content: message }
            ],
            model: MODEL_NAME,
            max_tokens: 200,
        });
        return res.status(200).send(completion.choices[0]?.message?.content || "No comment.");
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
        temperature: 0.2
    });

    const rawContent = jsonCompletion.choices[0]?.message?.content || "{}";
    let structuredData = extractJSON(rawContent);

    if (!structuredData || !structuredData.riskScore) {
        structuredData = FALLBACK_DATA;
    }

    if (structuredData.technicalAnalysis?.priceData) {
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map((p: any) => ({
            label: p.date,
            value: p.price,
            ma50: p.ma50
        }));
    }

    const reportCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are a Wall Street Analyst. Write a brief executive summary in Markdown." },
            { role: "user", content: `Data: ${JSON.stringify(structuredData)}` }
        ],
        model: MODEL_NAME,
    });

    const markdownReport = reportCompletion.choices[0]?.message?.content || "Analysis complete.";

    return res.status(200).json({ markdownReport, structuredData });

  } catch (error: any) {
    console.error("[GROQ API ERROR]", error);
    return res.status(500).json({ error: error.message || 'Forensic Engine Offline' });
  }
}