import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Schema, Type } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Use API_KEY from environment
const API_KEY = process.env.API_KEY || process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.warn("---------------------------------------------------");
  console.warn("⚠️  WARNING: API_KEY is missing.");
  console.warn("   The AI features will NOT work until you set it.");
  console.warn("---------------------------------------------------");
}

// --- CORS & MIDDLEWARE CONFIGURATION ---
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- AI CONFIGURATION ---
const MODEL_NAME = 'gemini-3-pro-preview';

// --- SCHEMAS ---
const technicalAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    priceData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          price: { type: Type.NUMBER },
          ma50: { type: Type.NUMBER }
        }
      }
    },
    rsiData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          value: { type: Type.NUMBER }
        }
      }
    },
    currentRsi: { type: Type.NUMBER },
    currentMa: { type: Type.NUMBER },
    signal: { type: Type.STRING, enum: ["Buy", "Sell", "Neutral"] }
  }
};

const bubbleAuditSchema = {
    type: Type.OBJECT,
    properties: {
        riskStatus: { type: Type.STRING, enum: ["Safe", "Elevated", "Critical"] },
        valuationVerdict: { type: Type.STRING, enum: ["Undervalued", "Fair Value", "Overvalued", "Bubble"] },
        score: { type: Type.NUMBER },
        fundamentals: { type: Type.STRING },
        peerContext: { type: Type.STRING },
        speculativeActivity: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Extreme"] },
        burstTrigger: { type: Type.STRING },
        liquidityStatus: { type: Type.STRING, enum: ["Abundant", "Neutral", "Drying Up", "Illiquid"] }
    }
};

const swotSchema = {
    type: Type.OBJECT,
    properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

const whistleblowerSchema = {
    type: Type.OBJECT,
    properties: {
        integrityScore: { type: Type.NUMBER },
        forensicVerdict: { type: Type.STRING },
        anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
        insiderDetails: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

const topBubbleAssetSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        riskScore: { type: Type.NUMBER },
        sector: { type: Type.STRING },
        price: { type: Type.STRING },
        reason: { type: Type.STRING }
    }
};

const mainSchema = {
    type: Type.OBJECT,
    properties: {
        riskScore: { type: Type.NUMBER, description: "Risk score from 0-100" },
        bubbleProbability: { type: Type.NUMBER, description: "Bubble probability from 0-100" },
        marketSentiment: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral", "Euphoric"] },
        keyMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                }
            }
        },
        technicalAnalysis: technicalAnalysisSchema,
        bubbleAudit: bubbleAuditSchema,
        swot: swotSchema,
        whistleblower: whistleblowerSchema,
        topBubbleAssets: { type: Type.ARRAY, items: topBubbleAssetSchema }
    },
    required: ["riskScore", "bubbleProbability", "marketSentiment", "keyMetrics", "technicalAnalysis", "bubbleAudit", "swot", "whistleblower", "topBubbleAssets"]
};

const JSON_SYSTEM_INSTRUCTION = `
You are a Senior Investment Banker and Forensic Financial Analyst.
Analyze the provided query or data.

CRITICAL RULES:
1. **SENTIMENT**: Must be "Bullish", "Bearish", "Neutral", or "Euphoric".
2. **DATA**: If real-time data is unavailable, provide realistic estimates based on your training data.
`;

const REPORT_SYSTEM_INSTRUCTION = `
You are a Wall Street Forensic Analyst. 
Based on the provided JSON data, write a High-Impact Executive Summary in Markdown.

Structure:
# Executive Summary
[Thesis statement]

## Evidence & Catalysts
[Bulleted list of key findings]

## Verdict
[Final conclusion]

MANDATORY ENDING: End with exactly one of: [[[Strong Buy]]], [[[Buy]]], [[[Hold]]], [[[Sell]]], or [[[Strong Sell]]].
`;

// Handle Preflight requests explicitly
app.options('*', cors());

// API Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { mode, data } = req.body;
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server Config Error: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Handle Chat Mode
    if (mode === 'chat') {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const history = payload.history || [];
        const message = payload.message || '';

        let conversationPrompt = "You are 'The Reality Check', a witty, sarcastic, but intelligent financial assistant. Keep answers short (under 50 words). Use emojis.\n\nConversation History:\n";
        history.forEach((h) => {
             conversationPrompt += `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}\n`;
        });
        conversationPrompt += `\nUser: ${message}`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: conversationPrompt,
        });
        
        return res.status(200).send(response.text || "I'm speechless.");
    }

    // Handle Analysis Modes
    let prompt = "";
    if (mode === 'market') {
        prompt = `Perform a deep forensic analysis for: ${data}`;
    } else if (mode === 'portfolio') {
        prompt = `Audit this portfolio for risk, exposure, and bubble vulnerability: ${data}`;
    } else if (mode === 'bubbles') {
        prompt = `Scan global markets for major Bubbles, Overvalued Assets, and Crash Risks. Identify at least 6 specific assets with high risk.`;
    }

    // Step A: Generate JSON Data
    const jsonResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            systemInstruction: JSON_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: mainSchema
        }
    });

    const structuredData = JSON.parse(jsonResponse.text || "{}");

    // Backfill trendData for compatibility
    if (structuredData.technicalAnalysis?.priceData) {
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map((p) => ({
            label: p.date,
            value: p.price,
            ma50: p.ma50
        }));
    }

    // Step B: Generate Markdown Report based on JSON
    const reportResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a report based on this data: ${JSON.stringify(structuredData)}`,
        config: {
            systemInstruction: REPORT_SYSTEM_INSTRUCTION
        }
    });

    const markdownReport = reportResponse.text || "Analysis complete.";

    return res.status(200).json({
        markdownReport,
        structuredData
    });

  } catch (error) {
    console.error("[API ERROR]", error);
    // Ensure we return a proper error object so frontend stops loading
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