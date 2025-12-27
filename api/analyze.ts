import { GoogleGenAI, Schema, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-pro-preview';

// --- SCHEMAS (Server-Side Definition) ---
const technicalAnalysisSchema: Schema = {
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

const bubbleAuditSchema: Schema = {
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

const swotSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

const whistleblowerSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        integrityScore: { type: Type.NUMBER },
        forensicVerdict: { type: Type.STRING },
        anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
        insiderDetails: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
};

const topBubbleAssetSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        riskScore: { type: Type.NUMBER },
        sector: { type: Type.STRING },
        price: { type: Type.STRING },
        reason: { type: Type.STRING }
    }
};

const mainSchema: Schema = {
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

// --- SYSTEM PROMPTS ---
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

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { mode, data } = req.body;
    
    // 1. Initialize Google GenAI with Server Environment Variable
    // This reads the key you set in Render
    const apiKey = process.env.API_KEY || process.env.GROQ_API_KEY; 

    if (!apiKey) {
      console.error("API_KEY missing in server environment");
      return res.status(500).json({ 
          error: 'Server Config Error: API_KEY is missing.',
          details: 'Please set the API_KEY environment variable in your Render Dashboard.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 2. Handle Chat Mode
    if (mode === 'chat') {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        const history = payload.history || [];
        const message = payload.message || '';

        // Construct conversation for Gemini
        let conversationPrompt = "You are 'The Reality Check', a witty, sarcastic, but intelligent financial assistant. Keep answers short (under 50 words). Use emojis.\n\nConversation History:\n";
        history.forEach((h: any) => {
             conversationPrompt += `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}\n`;
        });
        conversationPrompt += `\nUser: ${message}`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: conversationPrompt,
        });
        
        return res.status(200).send(response.text || "I'm speechless.");
    }

    // 3. Handle Analysis Modes (Market, Portfolio, Bubbles)
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
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map((p: any) => ({
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

  } catch (error: any) {
    console.error("[API ERROR]", error);
    return res.status(500).json({ error: error.message || 'Forensic Engine Offline', details: JSON.stringify(error) });
  }
}