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
// Render usually provides a PORT; fallback to 3000 for local testing
const PORT = process.env.PORT || 3000;

// --- DUAL-KEY COMPATIBILITY ---
// This ensures if you named it API_KEY or GROQ_API_KEY in Render, it works
const API_KEY = process.env.GROQ_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("❌ FATAL: GROQ_API_KEY is missing in Environment Variables.");
}

// --- CORS (Production Hardened) ---
app.use(cors({
  origin: '*', // Allows any origin to prevent preflight blocks during showcase
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Initialize Groq
const groq = new Groq({ apiKey: API_KEY });
const MODEL_NAME = 'llama-3.3-70b-versatile'; 

// --- JSON EXTRACTION (Your existing logic) ---
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

// Fallback Data
const FALLBACK_DATA = { /* ... your exact fallback object from above ... */ };

const JSON_SYSTEM_PROMPT = `Return valid JSON ONLY. Schema: { "riskScore": number, ... }`;

// --- MAIN ENDPOINT ---
app.post('/api/analyze', async (req, res) => {
  const { mode, data } = req.body;
  console.log(`[Groq] Processing ${mode} request...`);

  try {
    if (!API_KEY) throw new Error("API Key missing on server.");

    // 1. Chat Mode
    if (mode === 'chat') {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are 'The Reality Check'. Keep it brief." },
          ... (payload.history || []).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
          { role: "user", content: payload.message || '' }
        ],
        model: MODEL_NAME,
        max_tokens: 200,
      });
      return res.status(200).send(completion.choices[0]?.message?.content || "...");
    }

    // 2. Analysis Mode
    const jsonCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: JSON_SYSTEM_PROMPT },
        { role: "user", content: `Analyze: ${data}` }
      ],
      model: MODEL_NAME,
      response_format: { type: "json_object" }, //
      temperature: 0.1
    });

    const structuredData = extractJSON(jsonCompletion.choices[0]?.message?.content) || FALLBACK_DATA;

    const reportCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a Wall Street Analyst. Write a Markdown summary." },
        { role: "user", content: `Data: ${JSON.stringify(structuredData)}` }
      ],
      model: MODEL_NAME,
    });

    res.status(200).json({ 
      markdownReport: reportCompletion.choices[0]?.message?.content || "Done.", 
      structuredData 
    });

  } catch (error) {
    console.error("[Groq Error]", error);
    res.status(200).json({ 
      markdownReport: `### Engine Error\n${error.message}`, 
      structuredData: FALLBACK_DATA 
    });
  }
});

// --- DEPLOYMENT FIX: SERVE FRONTEND ---
// Tells Express where to find your React build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FinCap Production Engine Live on ${PORT}`);
});