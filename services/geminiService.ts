import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, PortfolioItem } from '../types';

// Hybrid Initialization: 
// If API_KEY is available (Dev mode / Build time injection), use Client SDK for max speed.
// If missing (Deployment), use the backend proxy.
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// Model Configuration
const MODEL_NAME = "gemini-3-pro-preview";

const JSON_SYSTEM_INSTRUCTION = `
  You are a Senior Investment Banker and Forensic Financial Analyst at a top-tier Wall Street firm.
  
  CRITICAL OPERATIONAL PROTOCOL:
  1. **DATA ACCURACY**: Use \`googleSearch\` for REAL-TIME prices/ratios. Do NOT guess.
  2. **VERIFICATION**: Verify valuations against earnings growth (PEG) and sector peers.
  3. **LOGIC**: 
     - High P/E (>Sector) + High RSI (>75) -> Bubble Risk.
     - Low P/E + Strong Cash Flow -> Undervalued.
  4. **FORMAT**: Output the JSON block *immediately*. Wrap in \`\`\`json ... \`\`\`.
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
        "fundamentals": "Brief summary of fundamentals.",
        "peerContext": "Brief peer comparison.",
        "speculativeActivity": "Moderate" | "High" | "Low" | "Extreme",
        "burstTrigger": "Catalyst (e.g. Rate Hikes).",
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
       "anomalies": ["Anomaly 1", "Anomaly 2"],
       "insiderDetails": ["Detail 1"]
    },
    "topBubbleAssets": [
        { "name": "Asset", "riskScore": 90, "sector": "Tech", "price": "$100", "reason": "Reason" }
    ]
  }
  \`\`\`

  STEP 2: FORENSIC VERDICT (Markdown)
  Write a professional executive summary (max 250 words).
  Paragraph 1: Thesis (Valuation).
  Paragraph 2: Evidence (Technicals/Macro).
  Paragraph 3: Verdict.
  
  MANDATORY ENDING: [[[Strong Buy]]], [[[Buy]]], [[[Hold]]], [[[Sell]]], or [[[Strong Sell]]].
`;

// --- HELPER: Fetch from Backend ---
const fetchFromBackend = async (mode: string, data: any) => {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, data })
    });
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server Error: ${response.status}`);
    }
    
    // For chat, it returns text directly
    if (mode === 'chat') {
        return await response.text();
    }
    
    // For analysis, it returns JSON with { text, metadata }
    return await response.json();
};

// --- HELPER: Response Parser ---
const parseResponse = (rawText: string, metadata: any[]): AnalysisResult => {
  let structuredData = null;
  let markdownReport = rawText;

  // Attempt to find JSON block
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

  if (jsonMatch && jsonMatch[1]) {
    try {
      const cleanJson = jsonMatch[1]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      structuredData = JSON.parse(cleanJson);
      markdownReport = rawText.replace(jsonMatch[0], '').trim();
    } catch (e) {
      console.error("JSON Parse Failed:", e);
    }
  } else {
      // Fallback
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
          try {
              const potentialJson = rawText.substring(firstBrace, lastBrace + 1);
              structuredData = JSON.parse(potentialJson);
              markdownReport = rawText.replace(potentialJson, '').trim();
          } catch (e) {}
      }
  }

  if (!markdownReport) markdownReport = "Analysis completed but returned no text content. Please try again.";

  return {
    markdownReport,
    structuredData,
    groundingChunks: metadata
  };
};

// --- EXPORTED FUNCTIONS ---

export const analyzeMarket = async (query: string, onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
  try {
    let text = "";
    let groundingChunks = [];

    if (ai) {
        // Client-side Execution (Fastest)
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: query,
            config: {
                systemInstruction: JSON_SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 1024 }, 
            }
        });
        text = response.text || "";
        groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } else {
        // Server-side Fallback
        const result = await fetchFromBackend('market', query);
        text = result.text;
        groundingChunks = result.metadata || [];
    }

    const result = parseResponse(text, groundingChunks);
    if (onUpdate) onUpdate(result);
    return result;

  } catch (error: any) {
    console.error("Market Analysis Error:", error);
    throw new Error(error.message || "Market analysis failed.");
  }
};

export const analyzePortfolio = async (portfolio: PortfolioItem[], onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
  try {
    const portfolioStr = JSON.stringify(portfolio);
    const prompt = `Audit this portfolio for risk and exposure: ${portfolioStr}`;
    
    let text = "";
    let groundingChunks = [];

    if (ai) {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: JSON_SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 1024 },
            }
        });
        text = response.text || "";
        groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } else {
        const result = await fetchFromBackend('portfolio', portfolioStr);
        text = result.text;
        groundingChunks = result.metadata || [];
    }
    
    const result = parseResponse(text, groundingChunks);
    if (onUpdate) onUpdate(result);
    return result;
  } catch (error: any) {
    console.error("Portfolio Analysis Error:", error);
    throw new Error(error.message || "Portfolio analysis failed.");
  }
};

export const analyzeBubbles = async (onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
  try {
    const prompt = `Scan global markets for major Bubbles, Overvalued Assets, and Crash Risks. Identify at least 4-6 specific assets.`;
    
    let text = "";
    let groundingChunks = [];

    if (ai) {
        const response = await ai.models.generateContent({
            model: MODEL_NAME, 
            contents: prompt,
            config: {
                systemInstruction: JSON_SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 1024 },
            }
        });
        text = response.text || "";
        groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } else {
        const result = await fetchFromBackend('bubbles', {});
        text = result.text;
        groundingChunks = result.metadata || [];
    }
    
    const result = parseResponse(text, groundingChunks);
    if (onUpdate) onUpdate(result);
    return result;
  } catch (error: any) {
    console.error("Bubble Analysis Error:", error);
    throw new Error(error.message || "Bubble analysis failed.");
  }
};

export const chatWithGemini = async (
  history: any[], 
  message: string, 
  context: { symbol: string, riskScore: number, sentiment: string }
): Promise<string> => {
    try {
        if (ai) {
            const chat = ai.chats.create({
                model: "gemini-3-flash-preview",
                config: {
                    systemInstruction: `You are 'The Reality Check', a witty, sarcastic, but intelligent financial assistant. 
                    Context: User is looking at ${context.symbol} (Risk: ${context.riskScore}, Sentiment: ${context.sentiment}).
                    Keep it short. Use emojis.`,
                }
            });
            const response = await chat.sendMessage({ message: message });
            return response.text || "I'm speechless.";
        } else {
            // Server fallback for chat
            // We need to pass the context in the message or construct the history carefully
            // For simplicity in fallback, we'll send the raw payload
            return await fetchFromBackend('chat', { history, message, context });
        }
    } catch (error) {
        console.error("Chat Error:", error);
        return "Connection lost. The Reality Check is offline.";
    }
};