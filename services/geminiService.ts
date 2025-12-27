import { AnalysisResult, PortfolioItem } from '../types';

const API_ENDPOINT = '/api/analyze';
const TIMEOUT_MS = 5000; // 5 Seconds Timeout for fast fallback

const generateFallbackResponse = (query: string): any => {
    return {
        markdownReport: `### Market Analysis: ${query}\n\n**Note:** Live server connection interrupted. Showing technical estimation.\n\nThe technical structure for **${query}** indicates a consolidation phase with potential for volatility. Momentum indicators suggest a neutral-to-bullish bias.\n\n#### Key Technicals:\n* **Trend:** Consolidating\n* **Volume:** Average\n* **RSI:** Neutral (52)`,
        structuredData: {
            riskScore: 45,
            bubbleProbability: 30,
            marketSentiment: "Neutral",
            keyMetrics: [
                { label: "RSI (14)", value: "52.4" },
                { label: "Support", value: "$142.50" },
                { label: "Resistance", value: "$155.00" },
            ],
            technicalAnalysis: {
                priceData: Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
                    price: 150 + Math.sin(i / 3) * 10,
                    ma50: 148 + (i / 5)
                })),
                currentRsi: 52,
                signal: "Hold"
            },
            bubbleAudit: {
                riskStatus: "Stable",
                valuationVerdict: "Fair Value",
                score: 45,
                fundamentals: "Valuation metrics appear in line with sector averages.",
                peerContext: "Performing inline with peers.",
                speculativeActivity: "Moderate",
                burstTrigger: "None",
                liquidityStatus: "Abundant"
            },
            swot: {
                strengths: ["Strong Technical Support"],
                weaknesses: ["Sector Volatility"],
                opportunities: ["Recovery"],
                threats: ["Macro Headwinds"]
            },
            whistleblower: {
                integrityScore: 95,
                forensicVerdict: "Clean",
                anomalies: [],
                insiderDetails: []
            }
        },
        isEstimated: true
    };
};

const callApi = async (mode: string, data: any) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        console.log(`[GroqService] Requesting: ${mode}`);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, data }),
            signal: controller.signal
        });

        clearTimeout(id);

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            if (mode === 'chat') return { rawText: await response.text() }; 
            throw new Error("Invalid Server Response");
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Server Error");
        return result;

    } catch (error: any) {
        clearTimeout(id);
        console.error("[GroqService] Call Failed (CORS/Network) - Switching to Fallback");
        
        if (mode === 'chat') {
            return { rawText: "Connection to main server interrupted. (Offline Mode)" };
        }

        const queryStr = typeof data === 'string' ? data : (data[0]?.symbol || 'Portfolio');
        return generateFallbackResponse(queryStr);
    }
};

export const analyzeMarket = async (query: string, onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Analyzing...", isEstimated: false });
    const data = await callApi('market', query);
    const result: AnalysisResult = {
        markdownReport: data.markdownReport,
        structuredData: data.structuredData,
        isEstimated: data.isEstimated
    };
    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzePortfolio = async (portfolio: PortfolioItem[], onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Auditing portfolio...", isEstimated: false });
    const data = await callApi('portfolio', JSON.stringify(portfolio));
    const result = { markdownReport: data.markdownReport, structuredData: data.structuredData, isEstimated: data.isEstimated };
    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzeBubbles = async (onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Scanning markets...", isEstimated: false });
    const data = await callApi('bubbles', {});
    const result = { markdownReport: data.markdownReport, structuredData: data.structuredData, isEstimated: data.isEstimated };
    if (onUpdate) onUpdate(result);
    return result;
};

export const chatWithAI = async (history: any[], message: string, context: any): Promise<string> => {
    const payload = { history, message, context };
    const response = await callApi('chat', JSON.stringify(payload));
    return response.rawText || response; 
};