import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- API KEY SETUP ---
const API_KEY = process.env.GROQ_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("❌ CRITICAL: GROQ_API_KEY is missing. Server will fail.");
}

// --- CORS ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- GROQ CLIENT ---
const groq = new Groq({ apiKey: API_KEY });
const MODEL_NAME = 'llama-3.3-70b-versatile'; 

// --- ROBUST JSON EXTRACTOR ---
function extractJSON(text) {
  try { return JSON.parse(text); } 
  catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) { try { return JSON.parse(match[1]); } catch (e2) {} }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch (e3) {}
    }
    return null;
  }
}

// --- FALLBACK DATA ---
const FALLBACK_DATA = {
  riskScore: 50,
  bubbleProbability: 50,
  marketSentiment: "Neutral",
  keyMetrics: [{ label: "Status", value: "System Online" }],
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
    fundamentals: "Data stream interrupted.",
    peerContext: "Unavailable",
    speculativeActivity: "Moderate",
    burstTrigger: "None",
    liquidityStatus: "Neutral"
  },
  swot: {
    strengths: ["Architecture Stable"],
    weaknesses: ["Data Feed Error"],
    opportunities: ["Retry"],
    threats: ["Network Latency"]
  },
  whistleblower: {
    integrityScore: 100,
    forensicVerdict: "Safe",
    anomalies: [],
    insiderDetails: []
  },
  topBubbleAssets: []
};

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

// --- API ENDPOINT ---
app.post('/api/analyze', async (req, res) => {
  const { mode, data } = req.body;
  console.log(`[GROQ SERVER] Request Mode: ${mode}`);

  try {
    // 1. Chat Mode
    if (mode === 'chat') {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const history = payload.history || [];
        const message = payload.message || '';
        
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are 'The Reality Check'. Be brief and witty." },
                ...history.map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
                { role: "user", content: message }
            ],
            model: MODEL_NAME,
            max_tokens: 200,
        });
        return res.status(200).send(completion.choices[0]?.message?.content || "...");
    }

    // 2. Analysis Mode
    let userPrompt = "";
    if (mode === 'market') userPrompt = `Analyze: ${data}`;
    else if (mode === 'portfolio') userPrompt = `Audit portfolio: ${data}`;
    else if (mode === 'bubbles') userPrompt = `Scan for bubbles.`;

    console.log("[GROQ SERVER] Generating JSON...");
    const jsonCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: JSON_SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
        ],
        model: MODEL_NAME,
        response_format: { type: "json_object" },
        temperature: 0.1
    });

    const rawContent = jsonCompletion.choices[0]?.message?.content || "{}";
    let structuredData = extractJSON(rawContent);

    if (!structuredData || !structuredData.riskScore) {
        console.warn("[GROQ SERVER] JSON Parse Failed, using fallback.");
        structuredData = FALLBACK_DATA;
    }

    // Compat: Backfill trendData
    if (structuredData.technicalAnalysis?.priceData) {
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map(p => ({
            label: p.date,
            value: p.price,
            ma50: p.ma50
        }));
    }

    console.log("[GROQ SERVER] Generating Report...");
    const reportCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are a Wall Street Analyst. Write a Markdown summary." },
            { role: "user", content: `Data: ${JSON.stringify(structuredData)}` }
        ],
        model: MODEL_NAME,
    });

    res.status(200).json({ 
      markdownReport: reportCompletion.choices[0]?.message?.content || "Analysis complete.", 
      structuredData 
    });

  } catch (error) {
    console.error("[GROQ SERVER ERROR]", error);
    // Return 200 with error info to prevent frontend crash
    res.status(200).json({ 
        markdownReport: `### Server Error\n${error.message}`,
        structuredData: FALLBACK_DATA 
    });
  }
});

// Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ GROQ-POWERED Server running on port ${PORT}`);
});