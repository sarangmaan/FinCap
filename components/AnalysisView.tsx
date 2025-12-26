import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import RiskGauge from './RiskGauge';
import RealityChat from './RealityChat';
import { Zap, MinusCircle, Target, AlertOctagon, ShieldCheck, Download, MessageCircle, Siren, X, TrendingUp, AlertTriangle, Flame, UserX } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SwotCard = ({ title, items, type }: { title: string, items: string[], type: 'strength' | 'weakness' | 'opportunity' | 'threat' }) => {
  const config = {
    strength: { color: 'text-emerald-400', border: 'border-emerald-500/30', hoverBorder: 'hover:border-emerald-500/60', icon: Zap },
    weakness: { color: 'text-amber-400', border: 'border-amber-500/30', hoverBorder: 'hover:border-amber-500/60', icon: MinusCircle },
    opportunity: { color: 'text-sky-400', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-500/60', icon: Target },
    threat: { color: 'text-rose-400', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500/60', icon: AlertOctagon },
  }[type];
  return (
    <div className={`bg-slate-900/60 backdrop-blur-xl border ${config.border} ${config.hoverBorder} p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300 ease-out break-inside-avoid page-break-avoid`}>
      <div className="flex items-center gap-3 mb-4">
        <config.icon className={`w-5 h-5 ${config.color}`} />
        <h4 className={`font-black text-sm uppercase tracking-widest ${config.color}`}>{title}</h4>
      </div>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="text-base text-slate-300 flex items-start gap-3">
            <span className={`mt-1.5 w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')} opacity-80 flex-shrink-0 shadow-sm`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const getSentimentEmoji = (sentiment: string) => {
    const s = (sentiment || '').toLowerCase();
    if (s.includes('bull')) return '🐂';
    if (s.includes('bear')) return '🐻';
    if (s.includes('euphoria') || s.includes('euphoric')) return '🚀';
    if (s.includes('fear') || s.includes('panic')) return '😱';
    if (s.includes('neutral')) return '⚖️';
    return '📊';
};

const getSentimentColor = (s: string) => {
    const sentiment = (s || '').toLowerCase();
    if (sentiment.includes('bull')) return 'text-emerald-400';
    if (sentiment.includes('bear')) return 'text-rose-400';
    if (sentiment.includes('neutral')) return 'text-amber-400';
    if (sentiment.includes('euphoria')) return 'text-purple-400';
    return 'text-white';
};

const AnalysisView: React.FC<{ data: AnalysisResult, title: string }> = ({ data, title }) => {
  const { markdownReport, structuredData } = data;
  const [showChat, setShowChat] = useState(false);
  const [showWhistleblower, setShowWhistleblower] = useState(false);

  const handleExport = () => {
    const element = document.getElementById('analysis-report');
    const opt = {
      margin: [5, 5, 5, 5], 
      filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fincap_audit.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#0f172a',
        windowWidth: 1600, // Ensure we capture the full desktop grid layout
        scrollY: 0
      },
      // Landscape orientation fits the 3-column dashboard layout much better on A4 paper
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save();
    } else {
        alert("PDF generator not loaded");
    }
  };

  return (
    <div className="animate-fade-in pb-20 w-full" id="analysis-report">
      <div className="flex flex-col items-center justify-center mb-10 border-b-2 border-white pb-8 gap-8 pt-8 break-inside-avoid">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">{title}</h1>
          <p className="text-sky-400 font-mono text-lg uppercase tracking-widest mt-4">Real-time Analysis Report</p>
        </div>
        
        {/* Buttons - Hidden in PDF */}
        <div className="flex flex-wrap justify-center gap-4 no-print" data-html2canvas-ignore>
           {structuredData?.whistleblower && (
               <button 
                  onClick={() => setShowWhistleblower(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/50 rounded-lg hover:bg-rose-500 hover:text-white transition-all font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)]"
               >
                  <Siren className="w-5 h-5" /> AI Whistleblower
               </button>
           )}
           
           <button 
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500/10 text-violet-400 border border-violet-500/50 rounded-lg hover:bg-violet-500 hover:text-white transition-all font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]"
           >
              <MessageCircle className="w-5 h-5" /> Reality Check
           </button>

           <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-white hover:text-slate-900 transition-all font-bold text-sm uppercase tracking-wider"
           >
              <Download className="w-5 h-5" /> Export Report
           </button>
        </div>
      </div>

      {structuredData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 break-inside-avoid">
            <div className="break-inside-avoid">
              <RiskGauge score={structuredData.riskScore} label="Risk Index" />
            </div>
            <div className="break-inside-avoid">
              <RiskGauge score={structuredData.bubbleProbability} label="Bubble Probability" />
            </div>
            
            {/* Sentiment Card */}
            <div className="break-inside-avoid bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-600 rounded-2xl p-6 flex flex-col justify-center items-start text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300 ease-out">
              <span className="text-white text-xs font-bold uppercase mb-2 tracking-wider">Market Sentiment</span>
              <div className={`text-4xl font-black uppercase ${getSentimentColor(structuredData.marketSentiment)}`}>
                <span className="mr-2">{getSentimentEmoji(structuredData.marketSentiment)}</span>
                {structuredData.marketSentiment}
              </div>
            </div>

            {/* Key Details Card */}
            <div className="break-inside-avoid bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-600 rounded-2xl p-6 flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300 ease-out">
              <span className="text-white text-sm font-black uppercase mb-6 tracking-widest border-b border-white/10 pb-2 block">Key Details</span>
              <div className="space-y-4 w-full">
                {structuredData.keyMetrics.map((m: any, i: number) => (
                  <div key={i} className="flex justify-between items-center w-full">
                    <span className="text-sky-400 font-bold text-base">{m.label}</span>
                    <span className="text-white font-mono font-bold text-lg">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 break-after-avoid">
             <h3 className="text-2xl font-black text-white uppercase tracking-tight">Technical Analysis (SWOT 📊)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <SwotCard title="Strengths" items={structuredData.swot.strengths} type="strength" />
            <SwotCard title="Weaknesses" items={structuredData.swot.weaknesses} type="weakness" />
            <SwotCard title="Opportunities" items={structuredData.swot.opportunities} type="opportunity" />
            <SwotCard title="Threats" items={structuredData.swot.threats} type="threat" />
          </div>
        </>
      ) : (
        <div className="p-10 border border-yellow-500/30 bg-yellow-500/5 rounded-2xl text-yellow-200 mb-12">
          Visual data extraction failed. Re-running the scan may fix this.
        </div>
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Forensic Verdict (Left 2/3) */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-10 h-fit break-inside-avoid">
            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
              <ShieldCheck className="w-8 h-8 text-sky-400" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Forensic Verdict</h2>
            </div>
            <div className="prose prose-invert max-w-none prose-lg">
              <MarkdownRenderer content={markdownReport} />
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6 break-inside-avoid">
              
              {/* Momentum Scan Box (Technical Analysis) */}
              <div className="break-inside-avoid bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                      <TrendingUp className="w-24 h-24 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3 relative z-10">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Technical Analysis</h3>
                  </div>
                  
                  {structuredData?.technicalAnalysis ? (
                      <div className="space-y-8 relative z-10">
                          {/* Price Action & MA */}
                          <div>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Price Action & Moving Average (50D)</span>
                              </div>
                              <div className="h-40 w-full mb-4">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={structuredData.technicalAnalysis.priceData}>
                                          <defs>
                                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                                                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                              </linearGradient>
                                          </defs>
                                          <Area type="monotone" dataKey="price" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                                          <Line type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                          <YAxis hide domain={['auto', 'auto']} />
                                      </AreaChart>
                                  </ResponsiveContainer>
                              </div>
                              <div className="flex gap-4 justify-center">
                                  <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Price</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">MA (50)</span>
                                  </div>
                              </div>
                          </div>

                          {/* RSI */}
                          <div>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-white font-black uppercase text-sm">RSI Momentum (14D)</span>
                                  <div className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
                                      Overbought &gt; 70 • Oversold &lt; 30
                                  </div>
                              </div>
                              <div className="h-24 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={structuredData.technicalAnalysis.rsiData}>
                                          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                                          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                                          <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
                                          <YAxis domain={[0, 100]} hide />
                                      </LineChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                          
                          <p className="text-[9px] text-slate-600 text-center font-medium italic border-t border-white/5 pt-4">
                             *Technical indicators are generated based on historical trends for illustrative purposes.
                          </p>
                      </div>
                  ) : (
                      <div className="text-slate-500 text-sm text-center py-4">No technical data available</div>
                  )}
              </div>

              {/* Bubble Warning Box */}
              <div className="break-inside-avoid bg-[#12141C] border border-rose-900/30 rounded-3xl p-6 shadow-xl shadow-rose-900/5 ring-1 ring-white/5">
                  <div className="flex items-center gap-2 mb-6 border-b border-rose-500/20 pb-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Bubble Warning</h3>
                  </div>

                  {structuredData?.bubbleAudit ? (
                     <div className="space-y-6">
                        {/* Risk Status */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Risk Status</span>
                            <span className={`text-sm font-black uppercase tracking-widest ${
                                structuredData.bubbleAudit.riskStatus === 'Critical' ? 'text-rose-500 animate-pulse' :
                                structuredData.bubbleAudit.riskStatus === 'Elevated' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                                {structuredData.bubbleAudit.riskStatus}
                            </span>
                        </div>

                        {/* Valuation Verdict */}
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Valuation Verdict</span>
                                <span className={`text-xs font-black uppercase tracking-wider ${
                                    structuredData.bubbleAudit.valuationVerdict === 'Bubble' || structuredData.bubbleAudit.valuationVerdict === 'Overvalued' ? 'text-rose-400' : 'text-sky-400'
                                }`}>
                                    {structuredData.bubbleAudit.valuationVerdict}
                                </span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full transition-all duration-1000 ${
                                      structuredData.bubbleAudit.valuationVerdict === 'Bubble' ? 'bg-rose-600 w-full' :
                                      structuredData.bubbleAudit.valuationVerdict === 'Overvalued' ? 'bg-rose-400 w-3/4' :
                                      structuredData.bubbleAudit.valuationVerdict === 'Fair Value' ? 'bg-sky-500 w-1/2' : 'bg-emerald-500 w-1/4'
                                 }`}></div>
                             </div>
                        </div>

                        {/* Analysis Boxes */}
                        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-slate-800 shadow-inner">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fundamentals</h4>
                             <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                 {structuredData.bubbleAudit.fundamentals}
                             </p>
                        </div>

                        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-slate-800 shadow-inner">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Peer Context</h4>
                             <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                 {structuredData.bubbleAudit.peerContext}
                             </p>
                        </div>
                        
                        {/* Liquidity Status (New) */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                             <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Liquidity Status</span>
                             <span className={`text-xs font-black uppercase ${
                                 structuredData.bubbleAudit.liquidityStatus === 'Drying Up' || structuredData.bubbleAudit.liquidityStatus === 'Illiquid' ? 'text-rose-400' :
                                 structuredData.bubbleAudit.liquidityStatus === 'Abundant' ? 'text-emerald-400' : 'text-amber-400'
                             }`}>
                                 {structuredData.bubbleAudit.liquidityStatus || 'N/A'}
                             </span>
                        </div>

                        {/* Speculative Activity */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                             <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Speculative Activity</span>
                             <span className={`text-xs font-black uppercase ${
                                 structuredData.bubbleAudit.speculativeActivity === 'High' || structuredData.bubbleAudit.speculativeActivity === 'Extreme' ? 'text-rose-400' : 
                                 structuredData.bubbleAudit.speculativeActivity === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                             }`}>
                                 {structuredData.bubbleAudit.speculativeActivity}
                             </span>
                        </div>
                        
                        {/* Burst Trigger (New) */}
                        <div className="mt-4 bg-rose-950/20 border border-rose-500/20 rounded-xl p-4">
                             <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Flame className="w-3 h-3 text-rose-500" /> Burst Trigger
                             </h4>
                             <p className="text-xs text-white leading-relaxed font-bold">
                                 {structuredData.bubbleAudit.burstTrigger || 'None detected at this stage.'}
                             </p>
                        </div>
                     </div>
                  ) : (
                     <div className="text-slate-500 text-sm text-center py-4">No bubble audit data available</div>
                  )}
              </div>
          </div>
      </div>

      {/* Whistleblower Modal */}
      {showWhistleblower && structuredData?.whistleblower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" data-html2canvas-ignore>
           <div className="bg-slate-900 border border-rose-500 w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[80vh]">
              <button onClick={() => setShowWhistleblower(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X className="w-6 h-6" /></button>
              
              <div className="bg-rose-950/30 p-6 border-b border-rose-500/30 flex items-center gap-4 flex-shrink-0">
                 <div className="p-3 bg-rose-500/20 rounded-full border border-rose-500/50">
                    <Siren className="w-8 h-8 text-rose-500 animate-pulse" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Whistleblower Report</h3>
                    <p className="text-rose-400 font-mono text-xs uppercase">Internal Anomalies & Insider Radar</p>
                 </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                 <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-bold uppercase text-sm">Integrity Score</span>
                    <div className="text-right">
                       <span className={`text-3xl font-black ${structuredData.whistleblower.integrityScore < 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {structuredData.whistleblower.integrityScore}/100
                       </span>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Forensic Verdict</h4>
                    <p className="text-slate-300 leading-relaxed border-l-2 border-rose-500 pl-4 py-1 bg-rose-500/5">
                        {structuredData.whistleblower.forensicVerdict}
                    </p>
                 </div>

                 <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-3">Detected Anomalies</h4>
                    <ul className="space-y-2">
                        {structuredData.whistleblower.anomalies.map((anomaly: string, i: number) => (
                           <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                              <AlertOctagon className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                              {anomaly}
                           </li>
                        ))}
                    </ul>
                 </div>
                 
                 {structuredData.whistleblower.insiderDetails && structuredData.whistleblower.insiderDetails.length > 0 && (
                     <div>
                        <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                           <UserX className="w-4 h-4 text-orange-400" /> Insider Radar
                        </h4>
                        <div className="bg-orange-950/10 border border-orange-500/20 rounded-xl p-4">
                           <ul className="space-y-3">
                              {structuredData.whistleblower.insiderDetails.map((detail: string, i: number) => (
                                 <li key={i} className="flex items-start gap-3 text-sm text-orange-200/90 font-medium">
                                    <span className="mt-1.5 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                    {detail}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Reality Chat Component */}
      <RealityChat 
         isOpen={showChat} 
         onClose={() => setShowChat(false)} 
         context={{
            symbol: title,
            riskScore: structuredData?.riskScore || 0,
            sentiment: structuredData?.marketSentiment || 'Neutral'
         }} 
      />

      {/* Footer Disclaimer */}
      <footer className="mt-20 py-8 border-t border-slate-800/50 text-center break-inside-avoid">
         <div className="max-w-4xl mx-auto px-4">
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-2">
                Disclaimer
             </p>
             <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Not financial advice. This analysis is generated by AI and may contain inaccuracies. Market data is simulated or approximate. 
                Always conduct your own due diligence before making investment decisions.
             </p>
         </div>
      </footer>
    </div>
  );
};

export default AnalysisView;