import { AnalysisResult, PortfolioItem } from '../types';

// The frontend now only communicates with the backend API.
// It does not need the API key or the GoogleGenAI SDK.

const API_ENDPOINT = '/api/analyze';

const callApi = async (mode: string, data: any) => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mode, data })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // If it's a chat response (text string)
        if (typeof result === 'string') return result;
        
        // If it's an analysis response (json object)
        return result;

    } catch (error: any) {
        console.error("API Call Failed:", error);
        throw error;
    }
};

export const analyzeMarket = async (query: string, onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) {
        onUpdate({
            markdownReport: "Connecting to secure forensic server...",
            isEstimated: false
        });
    }

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
    if (onUpdate) {
        onUpdate({
            markdownReport: "Auditing portfolio on secure server...",
            isEstimated: false
        });
    }

    const data = await callApi('portfolio', JSON.stringify(portfolio));

    const result: AnalysisResult = {
        markdownReport: data.markdownReport,
        structuredData: data.structuredData,
        isEstimated: false
    };

    if (onUpdate) onUpdate(result);
    return result;
};

export const analyzeBubbles = async (onUpdate?: (data: AnalysisResult) => void): Promise<AnalysisResult> => {
    if (onUpdate) {
        onUpdate({
            markdownReport: "Scanning global markets...",
            isEstimated: false
        });
    }

    const data = await callApi('bubbles', {});

    const result: AnalysisResult = {
        markdownReport: data.markdownReport,
        structuredData: data.structuredData,
        isEstimated: false
    };

    if (onUpdate) onUpdate(result);
    return result;
};

export const chatWithGemini = async (
  history: any[], 
  message: string, 
  context: { symbol: string, riskScore: number, sentiment: string }
): Promise<string> => {
    // We pass the full history + current message to the server
    const payload = {
        history,
        message,
        context
    };
    
    // The server returns a plain string for chat
    const responseText = await callApi('chat', JSON.stringify(payload));
    return responseText as unknown as string;
};