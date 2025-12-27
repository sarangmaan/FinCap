import { AnalysisResult, PortfolioItem } from '../types';

// CORRECT: Relative path ensures Render handles the routing without CORS issues
const API_ENDPOINT = '/api/analyze';

// CRITICAL FIX 1: Increased to 60s to survive Render's "Cold Start" delay
const TIMEOUT_MS = 60000; 

const callApi = async (mode: string, data: any) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        console.log(`[Service] Calling API: ${mode}`);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, data }),
            signal: controller.signal
        });

        clearTimeout(id);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }

        // CRITICAL FIX 2: Handle both JSON (Analysis) and Text (Chat) responses
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            // If server sends plain text (like in Chat Mode), return it wrapped
            const text = await response.text();
            return { rawText: text };
        }

    } catch (error: any) {
        clearTimeout(id);
        console.error("[Service] API Call Failed:", error);
        
        if (error.name === 'AbortError') {
            throw new Error("Request timed out. The server is waking up (this can take 50s on Render Free Tier). Try again.");
        }
        if (error.message.includes("Failed to fetch")) {
            throw new Error("Network Error. Deployment is unreachable.");
        }
        throw error;
    }
};

export const analyzeMarket = async (query: string, onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Connecting to forensic server...", isEstimated: false });

    // The backend returns { markdownReport, structuredData } JSON
    const data = await callApi('market', query);
    
    const result: AnalysisResult = {
        markdownReport: data.markdownReport,
        structuredData: data.structuredData,
        isEstimated: false // Groq is fast, no need for estimation flag usually
    };

    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzePortfolio = async (portfolio: PortfolioItem[], onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Auditing portfolio...", isEstimated: false });
    // Stringify portfolio here so backend receives it as a JSON string it can parse
    const data = await callApi('portfolio', JSON.stringify(portfolio));
    const result = { markdownReport: data.markdownReport, structuredData: data.structuredData, isEstimated: false };
    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzeBubbles = async (onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) onUpdate({ markdownReport: "Scanning markets...", isEstimated: false });
    // Backend ignores 'data' for bubbles, so passing empty object is fine
    const data = await callApi('bubbles', {});
    const result = { markdownReport: data.markdownReport, structuredData: data.structuredData, isEstimated: false };
    if (onUpdate) onUpdate(result);
    return result;
};

export const chatWithGemini = async (history: any[], message: string, context: any): Promise<string> => {
    const payload = { history, message, context };
    // FIX: Extract the raw text from the wrapper we created in callApi
    const response = await callApi('chat', JSON.stringify(payload));
    return response.rawText || response; 
};