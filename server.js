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

// --- CORS MIDDLEWARE ---
// origin: true dynamically sets Access-Control-Allow-Origin to the request Origin header.
// This allows strict security (credentials: true) without the wildcard (*) conflict.
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Enable pre-flight for all routes
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- API KEY SETUP ---
const API_KEY = process.env.GROQ_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("❌ CRITICAL ERROR: GROQ_API_KEY is missing in .env file.");
}

// --- GROQ CLIENT ---
const groq = new Groq({ apiKey: API_KEY || 'dummy_key' });
const MODEL_NAME = 'llama-3.3-70b-versatile'; 

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

app.post('/api/analyze', async (req, res) => {
  const { mode, data } = req.body;
  console.log(`[GROQ SERVER] Request Mode: ${mode}`);

  if (!API_KEY) {
    return res.json({
      markdownReport: "### Configuration Error\n\nNo API Key found. Check .env",
      structuredData: FALLBACK_DATA
    });
  }

  try {
    if (mode === 'chat') {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are 'The Reality Check'. Be brief, witty, and financially savvy." },
                ... (payload.history || []).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
                { role: "user", content: payload.message || '' }
            ],
            model: MODEL_NAME,
            max_tokens: 200,
        });
        return res.send(completion.choices[0]?.message?.content || "...");
    }

    let userPrompt = mode === 'market' ? `Analyze: ${data}` : mode === 'portfolio' ? `Audit portfolio: ${data}` : `Scan bubbles.`;

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
        structuredData = FALLBACK_DATA;
    }

    // Backfill trendData for compatibility
    if (structuredData.technicalAnalysis?.priceData) {
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map(p => ({
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

    res.json({ 
      markdownReport: reportCompletion.choices[0]?.message?.content || "Analysis complete.", 
      structuredData 
    });

  } catch (error) {
    console.error("[GROQ SERVER ERROR]", error);
    res.json({ 
        markdownReport: `### Server Error\n${error.message}`,
        structuredData: FALLBACK_DATA 
    });
  }
});

// Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- GLOBAL ERROR HANDLER ---
// Captures any sync/async crashes and returns JSON to prevent HTML stacktrace CORS errors
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL SERVER ERROR:", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});