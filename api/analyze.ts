import Groq from 'groq-sdk';

const MODEL_NAME = 'llama-3.3-70b-versatile';

export default async function handler(req: any, res: any) {
  // --- ROBUST CORS ---
  const origin = req.headers.origin;
  
  // If an origin is present, reflect it to allow credentials
  if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  // Handle pre-flight immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { mode, data } = req.body;
    const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    const groq = new Groq({ apiKey });

    // (Simple logic for fallback data structure)
    const fallback = { riskScore: 50, marketSentiment: "Neutral", keyMetrics: [] };

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

    const jsonCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Return JSON. Schema: { riskScore: number, marketSentiment: string, bubbleAudit: object, technicalAnalysis: object, swot: object, whistleblower: object, topBubbleAssets: array }" },
            { role: "user", content: `Analyze: ${JSON.stringify(data)}` }
        ],
        model: MODEL_NAME,
        response_format: { type: "json_object" },
        temperature: 0.1
    });

    const structuredData = JSON.parse(jsonCompletion.choices[0]?.message?.content || "{}");
    
    // Backfill trendData
    if (structuredData.technicalAnalysis?.priceData) {
        structuredData.trendData = structuredData.technicalAnalysis.priceData.map((p: any) => ({
            label: p.date, value: p.price, ma50: p.ma50
        }));
    }

    const reportCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Write a markdown report." },
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
    // Return a valid JSON even on error to prevent CORS issues with default error pages
    return res.status(200).json({ 
        error: error.message,
        structuredData: { riskScore: 0, marketSentiment: "Error" } 
    });
  }
}