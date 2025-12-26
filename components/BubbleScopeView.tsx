import React from 'react';
import { AnalysisResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import RiskGauge from './RiskGauge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  AlertOctagon, 
  Flame, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Search,
  Loader2,
  Play
} from 'lucide-react';

interface BubbleScopeViewProps {
  data: AnalysisResult | null;
  onScan: () => void;
  isLoading: boolean;
}

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-slate-800/50 rounded-xl ${className}`}></div>
);

const BubbleAssetCard: React.FC<{ asset: any }> = ({ asset }) => {
    return (
        <div className="glass-card border-l-4 border-l-rose-500 rounded-xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame className="w-16 h-16 text-rose-500" />
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h4 className="font-extrabold text-xl text-white tracking-tight">{asset.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{asset.sector}</span>
                </div>
                <div className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider ${asset.riskScore > 80 ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/50' : 'bg-orange-500 text-slate-900'}`}>
                    {asset.riskScore}/100 Risk
                </div>
            </div>

            <div className="mb-4 relative z-10">
                <div className="text-3xl font-mono text-rose-300 font-black">{asset.price}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Current Valuation</div>
            </div>

            <p className="text-sm text-slate-300 border-t border-white/5 pt-3 relative z-10 leading-relaxed font-medium">
                {asset.reason}
            </p>
        </div>
    );
};

const BubbleScopeView: React.FC<BubbleScopeViewProps> = ({ data, onScan, isLoading }) => {
  if (!data) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
            <div className="bg-rose-500/10 p-6 rounded-full mb-6 ring-1 ring-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
               <Activity className="w-12 h-12 text-rose-500" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">Market Bubble Scope</h1>
            <p className="text-slate-400 max-w-lg mx-auto mb-10 text-lg">
               Scan global indices and assets for irrational exuberance, valuation divergence, and systemic risk anomalies.
            </p>
            <button 
               onClick={onScan} 
               disabled={isLoading}
               className="group relative flex items-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_10px_40px_-10px_rgba(244,63,94,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(244,63,94,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
               {isLoading ? 'Scanning Markets...' : 'Initiate Global Scan'}
            </button>
        </div>
     );
  }

  const { markdownReport, structuredData } = data;
  const isStreaming = !structuredData;

  return (
    <div className="animate-fade-in pb-20">
        {/* Header */}
        <div className="relative mb-12 text-center">
            <div className="absolute inset-x-0 -top-20 -bottom-20 bg-rose-500/5 blur-[100px] pointer-events-none"></div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-950/20 text-rose-300 text-[10px] font-extrabold mb-6 uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                <Activity className="w-3 h-3 animate-pulse" />
                Systemic Risk Monitor
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">Bubble Scope</h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
                Real-time detection of disconnected valuations and irrational exuberance.
            </p>
        </div>

        {/* Key Warning Metrics */}
        {isStreaming ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        ) : structuredData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2">Global Fragility</div>
                        <div className={`text-5xl font-black ${structuredData.riskScore > 70 ? 'text-rose-500' : 'text-yellow-500'}`}>
                            {structuredData.riskScore}
                        </div>
                    </div>
                    <RiskGauge score={structuredData.riskScore} label="" type="risk" />
                </div>

                <div className="glass-card p-8 rounded-2xl col-span-2 flex flex-col justify-center">
                    <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-rose-500" />
                        Critical Warning Signals
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {structuredData.warningSignals?.map((signal, i) => (
                            <span key={i} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm font-bold flex items-center gap-2 shadow-inner">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                {signal}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: The Red Zones (Identified Bubbles) */}
            <div className="lg:col-span-8 space-y-8">
                <div>
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                        <Flame className="w-6 h-6 text-rose-500" />
                        Active Red Zones
                    </h3>
                    
                    {isStreaming ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-48" />
                            <Skeleton className="h-48" />
                        </div>
                    ) : structuredData?.topBubbleAssets && structuredData.topBubbleAssets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {structuredData.topBubbleAssets.map((asset, idx) => (
                                <BubbleAssetCard key={idx} asset={asset} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 glass-card rounded-xl text-center text-slate-400 font-medium">
                             No specific extreme bubbles detected in structured analysis. See report for details.
                        </div>
                    )}
                </div>

                {/* Analysis Report */}
                <div className="glass-card p-10 rounded-3xl">
                    <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                        <Search className="w-6 h-6 text-sky-400" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Forensic Analysis</h2>
                        {isStreaming && <Loader2 className="w-5 h-5 animate-spin text-slate-500 ml-auto" />}
                    </div>
                    <MarkdownRenderer content={markdownReport} />
                </div>
            </div>

            {/* Right Column: Visuals & Sentiment */}
            <div className="lg:col-span-4 space-y-6">
                {/* Bubble Divergence Chart */}
                {structuredData?.trendData && (
                    <div className="glass-card p-6 rounded-2xl">
                        <h3 className="text-[10px] font-extrabold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-rose-400" />
                            Price vs Reality Divergence
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={structuredData.trendData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="label" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px', backdropFilter: 'blur(4px)' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#f43f5e" 
                                        fillOpacity={1} 
                                        fill="url(#colorPrice)" 
                                        name="Market Price"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="ma50" 
                                        stroke="#10b981" 
                                        strokeDasharray="4 4"
                                        fill="none" 
                                        name="Fair Value Est"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-4 text-center font-medium leading-relaxed">
                            Red line indicates market price, green dashed line indicates estimated fair value. Wide gaps indicate bubble risk.
                        </p>
                    </div>
                )}

                {/* Market Sentiment */}
                {structuredData && (
                     <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl ${
                         structuredData.marketSentiment === 'Euphoric' ? 'bg-purple-900/20 border-purple-500/30' : 'glass-card'
                     }`}>
                         <h3 className="text-[10px] font-extrabold text-slate-300 mb-2 uppercase tracking-widest">Market Psychology</h3>
                         <div className="text-4xl font-black text-white mb-2 tracking-tight">{structuredData.marketSentiment || "Neutral"}</div>
                         <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mt-3 border border-white/5">
                             <div 
                                className={`h-full transition-all duration-1000 ${
                                    structuredData.marketSentiment === 'Euphoric' ? 'bg-purple-500 w-[90%]' : 
                                    structuredData.marketSentiment === 'Bearish' ? 'bg-rose-500 w-[20%]' : 'bg-emerald-500 w-[60%]'
                                }`}
                             ></div>
                         </div>
                         <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                             <span>Fear</span>
                             <span>Greed</span>
                         </div>
                     </div>
                )}

                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-[10px] font-extrabold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        Safe Havens
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors group">
                            <span>Gold (XAU)</span>
                            <span className="text-emerald-400 font-mono bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/20">Strong</span>
                        </li>
                        <li className="flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors group">
                            <span>Govt Bonds (TLT)</span>
                            <span className="text-yellow-400 font-mono bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-500/20">Neutral</span>
                        </li>
                        <li className="flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors group">
                            <span>Consumer Staples</span>
                            <span className="text-emerald-400 font-mono bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/20">Strong</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BubbleScopeView;