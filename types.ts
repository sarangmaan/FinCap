
export interface ChartDataPoint {
  label: string;
  value: number;
  ma50?: number;
  rsi?: number;
}

export interface TechnicalAnalysisData {
  priceData: { date: string; price: number; ma50: number }[];
  rsiData: { date: string; value: number }[];
  currentRsi: number;
  currentMa: number;
  signal: 'Buy' | 'Sell' | 'Neutral';
}

export interface BubbleAudit {
  riskStatus: 'Safe' | 'Elevated' | 'Critical';
  valuationVerdict: 'Undervalued' | 'Fair Value' | 'Overvalued' | 'Bubble';
  score: number;
  fundamentals: string; // "Price is slightly ahead of recent earnings..."
  peerContext: string; // "P/E ratio is a slight premium..."
  speculativeActivity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  burstTrigger: string; // "Fed rate hike...", "Earnings miss..."
  liquidityStatus: 'Abundant' | 'Neutral' | 'Drying Up' | 'Illiquid';
}

export interface WhistleblowerData {
  integrityScore: number;
  verdict: 'Clean' | 'Suspicious' | 'High Risk' | 'Manipulation Detected';
  forensicVerdict: string;
  anomalies: string[];
  insiderActivity: string;
  accountingFlags: string;
  insiderDetails?: string[]; // Added for specific trade details
}

export interface StructuredAnalysisData {
  riskScore: number;
  bubbleProbability: number;
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Euphoric';
  keyMetrics: { label: string; value: string }[];
  trendData: ChartDataPoint[]; // Kept for legacy compatibility if needed
  
  // New detailed fields
  technicalAnalysis?: TechnicalAnalysisData;
  bubbleAudit?: BubbleAudit;
  warningSignals?: string[]; // Added missing field
  
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  whistleblower?: WhistleblowerData;
  topBubbleAssets?: {
    name: string;
    riskScore: number;
    sector: string;
    price: string;
    reason: string;
  }[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResult {
  markdownReport: string;
  structuredData?: StructuredAnalysisData;
  groundingChunks?: GroundingChunk[];
  isEstimated?: boolean;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ANALYZING = 'ANALYZING',
  REPORT = 'REPORT',
  PORTFOLIO = 'PORTFOLIO',
  BUBBLE_SCOPE = 'BUBBLE_SCOPE',
  ERROR = 'ERROR'
}
