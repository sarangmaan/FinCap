import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- AI CONFIGURATION ---
const MODEL_NAME = "gemini-3-pro-preview";

const JSON_SYSTEM_INSTRUCTION = `
  You are a Senior Investment Banker and Forensic Financial Analyst.
  
  CRITICAL PROTOCOL:
  1. **ACCURACY**: Use \`googleSearch\` for REAL-TIME data. No guessing.
  2. **VERIFY**: Check P/E vs Sector & Earnings Growth.
  3. **LOGIC**: High P/E + High RSI = Risk. Low P/E + Cash Flow = Value.
  4. **FORMAT**: Output the JSON block *immediately* at the start.
  5. **SENTIMENT**: STRICTLY "Bullish", "Bearish", or "Neutral".

  STEP 1: GENERATE JSON DATA
  \`\`\`json
  {
    "riskScore": number (0-100),
    "bubbleProbability": number (0-100),
    "marketSentiment": "Bullish" | "Bearish" | "Neutral",
    "keyMetrics": [
      { "label": "Price", "value": "$..." },
      { "label": "Market Cap", "value": "..." },
      { "label": "P/E Ratio", "value": "..." },
      { "label": "52W High", "value": "..." }
    ],
    "technicalAnalysis": {
        "priceData": [
            { "date": "T-5", "price": 100, "ma50": 95 },
            { "date": "T-4", "price": 102, "ma50": 96 },
            { "date": "T-3", "price": 105, "ma50": 97 },
            { "date": "T-2", "price": 103, "ma50": 98 },
            { "date": "T-1", "price": 108, "ma50": 99 },
            { "date": "Now", "price": 110, "ma50": 100 }
        ],
        "rsiData": [
            { "date": "T-5", "value": 45 },
            { "date": "T-4", "value": 50 },
            { "date": "T-3", "value": 55 },
            { "date": "T-2", "value": 52 },
            { "date": "T-1", "value": 60 },
            { "date": "Now", "value": 65 }
        ],
        "currentRsi": 65,
        "currentMa": 100,
        "signal": "Buy" | "Sell" | "Neutral"
    },
    "bubbleAudit": {
        "riskStatus": "Elevated" | "Safe" | "Critical",
        "valuationVerdict": "Overvalued" | "Fair Value" | "Undervalued" | "Bubble",
        "score": 75,
        "fundamentals": "Brief fundamental summary.",
        "peerContext": "Brief peer comparison.",
        "speculativeActivity": "Moderate" | "High" | "Low" | "Extreme",
        "burstTrigger": "Catalyst.",
        "liquidityStatus": "Abundant" | "Neutral" | "Drying Up" | "Illiquid"
    },
    "warningSignals": ["Signal 1", "Signal 2"],
    "swot": {
      "strengths": ["1", "2", "3", "4"],
      "weaknesses": ["1", "2", "3", "4"],
      "opportunities": ["1", "2", "3", "4"],
      "threats": ["1", "2", "3", "4"]
    },
    "whistleblower": {
       "integrityScore": number (0-100),
       "forensicVerdict": "Summary",
       "anomalies": ["Anomaly 1"],
       "insiderDetails": ["Detail 1"]
    },
    "topBubbleAssets": [
        { "name": "Asset", "riskScore": 90, "sector": "Tech", "price": "$100", "reason": "Reason" }
    ]
  }
  \`\`\`

  STEP 2: FORENSIC VERDICT (Markdown)
  Write a high-impact, 3-paragraph executive summary (max 250 words). 
  Paragraph 1: Thesis.
  Paragraph 2: Evidence.
  Paragraph 3: Verdict.
  
  MANDATORY ENDING: [[[Strong Buy]]], [[[Buy]]], [[[Hold]]], [[[Sell]]], or [[[Strong Sell]]].
`;

// API Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { mode, data } = req.body;
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server Config Error: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    let systemInstruction = "";
    let prompt = "";
    
    if (mode === 'market') {
        systemInstruction = JSON_SYSTEM_INSTRUCTION;
        prompt = `Perform a forensic deep-dive analysis for: "${data}". Verify all data using search.`;
    } else if (mode === 'portfolio') {
        systemInstruction = JSON_SYSTEM_INSTRUCTION;
        prompt = `Audit this portfolio for risk and exposure: ${data}.`;
    } else if (mode === 'bubbles') {
        systemInstruction = JSON_SYSTEM_INSTRUCTION;
        prompt = `Scan global markets for major Bubbles, Overvalued Assets, and Crash Risks. Identify at least 4-6 specific assets.`;
    } else if (mode === 'chat') {
        let payload;
        try { payload = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { payload = { history: [], message: data }; }
        systemInstruction = `You are 'The Reality Check', a witty, sarcastic financial assistant. Keep it short.`;
        const historyText = payload.history ? payload.history.map((h) => `${h.sender === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n') : '';
        prompt = `Previous conversation:\n${historyText}\n\nCurrent User Message: ${payload.message}`;
    }

    const config = {
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 8192,
    };

    // Enable reduced thinking budget (1024) for complex tasks to balance speed/accuracy
    if (mode !== 'chat') {
        config.thinkingConfig = { thinkingBudget: 1024 };
    } else {
        config.temperature = 0.7;
    }

    const result = await ai.models.generateContent({
      model: mode === 'chat' ? 'gemini-3-flash-preview' : MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: config
    });

    const text = result.text;
    
    if (mode === 'chat') {
        return res.status(200).send(text || "I'm speechless.");
    }
    
    const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const uniqueSources = [];
    const seenUris = new Set();
    
    if (sources) {
        for (const g of sources) {
            if (g.web?.uri && !seenUris.has(g.web.uri)) {
                seenUris.add(g.web.uri);
                uniqueSources.push(g);
            }
        }
    }

    return res.status(200).json({
        text: text,
        metadata: uniqueSources
    });

  } catch (error) {
    console.error("[API ERROR]", error);
    return res.status(500).json({ error: error.message || 'Forensic Engine Offline', details: JSON.stringify(error) });
  }
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});