import { AnalysisResult, PortfolioItem } from '../types';

const API_ENDPOINT = '/api/analyze';
const TIMEOUT_MS = 60000; 

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
            // This usually happens if the server crashes or returns an HTML error page (like 404/500 from Render)
            const text = await response.text();
            if (mode === 'chat') return { rawText: text }; // Chat might return text
            console.error("Non-JSON Response:", text.substring(0, 200));
            throw new Error(`Server returned non-JSON. The deployment might be restarting. Try again in 10s.`);
        }

        const result = await response.json();
        
        if (!response.ok) {
            // Check if it is a legacy Google error
            if (result.error && result.error.domain === 'googleapis.com') {
                throw new Error("DEPLOYMENT STALE: The server is still running Google Gemini code. Please redeploy.");
            }
            throw new Error(result.error || "Unknown Server Error");
        }

        return result;

    } catch (error: any) {
        clearTimeout(id);
        console.error("[GroqService] Call Failed:", error);
        
        if (error.name === 'AbortError') {
            throw new Error("Request timed out (60s). The server is busy.");
        }
        throw error;
    }
};

export const analyzeMarket = async (query: string, onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Analyzing with Groq Llama 3...", isEstimated: false });
    const data = await callApi('market', query);
    const result: AnalysisResult = {
        markdownReport: data.markdownReport,
        structuredData: data.structuredData,
        isEstimated: false
    };
    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzePortfolio = async (portfolio: PortfolioItem[], onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Auditing portfolio...", isEstimated: false });
    const data = await callApi('portfolio', JSON.stringify(portfolio));
    const result = { markdownReport: data.markdownReport, structuredData: data.structuredData, isEstimated: false };
    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzeBubbles = async (onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Scanning markets...", isEstimated: false });
    const data = await callApi('bubbles', {});
    const result = { markdownReport: data.markdownReport, structuredData: data.structuredData, isEstimated: false };
    if (onUpdate) onUpdate(result);
    return result;
};

export const chatWithGemini = async (history: any[], message: string, context: any): Promise<string> => {
    const payload = { history, message, context };
    const response = await callApi('chat', JSON.stringify(payload));
    return response.rawText || response; 
};