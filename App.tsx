import React, { useState, useEffect } from 'react';
import { ViewState, AnalysisResult, PortfolioItem } from './types';
import AnalysisView from './components/AnalysisView';
import PortfolioView from './components/PortfolioView';
import BubbleScopeView from './components/BubbleScopeView';
import SearchBar from './components/SearchBar';
import Logo from './components/Logo';
import { BarChart3, AlertTriangle, DollarSign, PieChart, Activity, Loader2, ScanLine } from 'lucide-react';
import { analyzeMarket, analyzePortfolio, analyzeBubbles } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [query, setQuery] = useState('');
  const [analyzedQuery, setAnalyzedQuery] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('fincap_portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fincap_portfolio', JSON.stringify(portfolioItems));
  }, [portfolioItems]);

  const handleError = (err: any) => {
      console.error("App Error:", err);
      setError(err.message || 'Analysis Failed. Check console.');
      setView(ViewState.ERROR);
  };

  const handleUpdatePortfolio = (items: PortfolioItem[]) => {
    setPortfolioItems(items);
  };

  const performAnalysis = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setAnalyzedQuery(searchQuery);
    setResult(null);
    setView(ViewState.ANALYZING);

    try {
      await analyzeMarket(searchQuery, (partialResult) => {
          setResult((prev) => {
             return {
                markdownReport: partialResult.markdownReport || prev?.markdownReport || "",
                structuredData: partialResult.structuredData || prev?.structuredData,
                groundingChunks: partialResult.groundingChunks || prev?.groundingChunks,
                isEstimated: partialResult.isEstimated
             };
          });
      });
      setView(ViewState.REPORT);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      performAnalysis(q);
    }
  }, []);

  const handleAnalyzePortfolio = async () => {
    if (portfolioItems.length === 0) return;
    setLoading(true);
    setError(null);
    setAnalyzedQuery("Portfolio Risk Audit");
    setResult(null);
    setView(ViewState.ANALYZING);

    try {
      await analyzePortfolio(portfolioItems, (partialResult) => {
          setResult(partialResult);
      });
      setView(ViewState.REPORT);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBubbleScope = async () => {
      setLoading(true);
      setError(null);
      setAnalyzedQuery("Global Market Bubble Scope");
      setResult(null); 
      setView(ViewState.BUBBLE_SCOPE);
      
      try {
          await analyzeBubbles((partialResult) => {
              setResult(partialResult);
          });
      } catch (err: any) {
          handleError(err);
      } finally {
          setLoading(false);
      }
  };
  
  const handleRetry = () => {
    setView(ViewState.DASHBOARD);
    setError(null);
    setQuery('');
  };

  const handleNavClick = (viewName: string) => {
      if (viewName === 'Portfolio') {
        setView(ViewState.PORTFOLIO);
      }
      else if (viewName === 'Markets') {
        setView(ViewState.DASHBOARD);
      }
      else if (viewName === 'Bubble Scope') {
         setResult(null);
         setView(ViewState.BUBBLE_SCOPE);
      }
  };

  return (
    <div 
      className="relative min-h-screen text-white font-sans selection:bg-sky-500/30 overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)'
      }}
    >
      <div className="bg-grain"></div>

      <div className="relative z-10 flex flex-col min-h-screen pt-4 pb-4 px-6 md:px-8">
        <nav className="sticky top-4 z-40 bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl border border-white/10 mb-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView(ViewState.DASHBOARD); handleNavClick('Markets'); }}>
              <div className="relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-sky-500/10 blur-md rounded-full group-hover:bg-sky-500/20 transition-all"></div>
                 <Logo className="w-8 h-8 relative z-10" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-sky-400 transition-colors">Fin<span className="text-sky-500">Cap</span></span>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2 text-sm font-semibold text-slate-400">
              <button onClick={() => handleNavClick('Markets')} className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${view === ViewState.DASHBOARD || view === ViewState.REPORT || view === ViewState.ANALYZING ? 'text-white bg-slate-800/50 shadow-inner' : 'hover:text-white hover:bg-white/5'}`}>Markets</button>
              <button onClick={() => handleNavClick('Portfolio')} className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${view === ViewState.PORTFOLIO ? 'text-white bg-slate-800/50 shadow-inner' : 'hover:text-white hover:bg-white/5'}`}>Portfolio</button>
              <button onClick={() => handleNavClick('Bubble Scope')} className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${view === ViewState.BUBBLE_SCOPE ? 'bg-rose-950/20 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'hover:text-rose-400 hover:bg-rose-950/10'}`}>
                 <Activity className="w-3.5 h-3.5" /> Bubble Scope
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-grow w-full max-w-7xl mx-auto">
          
          <div className={`mb-12 transition-all duration-700 ease-out ${view === ViewState.DASHBOARD ? 'translate-y-0 opacity-100' : ''} overflow-visible`}>
             <div className={`max-w-4xl mx-auto ${view !== ViewState.DASHBOARD ? 'hidden' : 'block'}`}>
                <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6 text-white tracking-tight drop-shadow-sm">
                  Predict the Crash. <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Find the Opportunity.</span>
                </h1>
                <p className="text-center text-slate-400 mb-10 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                  Institutional-grade AI analysis for the modern investor. Detect bubbles, audit portfolios, and uncover hidden risks.
                </p>
             </div>
             
             <div className={`max-w-3xl mx-auto ${view === ViewState.REPORT || view === ViewState.PORTFOLIO || view === ViewState.BUBBLE_SCOPE || view === ViewState.ANALYZING ? 'scale-95 opacity-0 h-0 overflow-visible pointer-events-none' : 'overflow-visible'}`}>
               <SearchBar 
                  query={query} 
                  setQuery={setQuery} 
                  onSearch={performAnalysis} 
                  loading={loading}
               />

               <div className="flex flex-wrap justify-center gap-3 mt-8 text-xs font-semibold text-slate-500 pointer-events-auto">
                  <span className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-sky-500/50 hover:text-sky-400 transition-all hover:bg-slate-800" onClick={() => { setQuery('Top trending stocks and assets today'); performAnalysis('Top trending stocks and assets today'); }}>🔥 Trending Assets</span>
                  <span className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-rose-500/50 hover:text-rose-400 transition-all hover:bg-slate-800" onClick={() => { setQuery('Is there a bubble in AI stocks?'); performAnalysis('Is there a bubble in AI stocks?'); }}>🤖 AI Bubble Risk</span>
                  <span className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-400 transition-all hover:bg-slate-800" onClick={() => { setQuery('Analyze Housing Market 2024'); performAnalysis('Analyze Housing Market 2024'); }}>🏠 Macro Housing</span>
                  <span className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-purple-500/50 hover:text-purple-400 transition-all hover:bg-slate-800" onClick={() => { setQuery('Crypto Market Outlook'); performAnalysis('Crypto Market Outlook'); }}>🪙 Crypto Outlook</span>
               </div>
             </div>
          </div>

          {view === ViewState.ANALYZING && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-sky-500 blur-2xl opacity-20 animate-pulse"></div>
                     <div className="relative z-10 bg-slate-900 rounded-full p-6 ring-1 ring-white/10 shadow-2xl">
                         <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
                     </div>
                     <div className="absolute -inset-4 border border-dashed border-sky-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Initiating Scan
                  </h2>
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-sm bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
                      <ScanLine className="w-4 h-4 animate-pulse text-sky-400" />
                      <span>Analyzing market data for <span className="text-white font-bold">"{analyzedQuery}"</span>...</span>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">Connecting to secure server...</p>
              </div>
          )}
          
          {view === ViewState.ERROR && (
            <div className="max-w-2xl mx-auto text-center py-20 glass-card rounded-2xl border-rose-900/30 animate-in fade-in">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-3">Analysis Halted</h2>
              <p className="text-slate-400 mb-8 px-6 leading-relaxed font-mono text-sm">{error}</p>
              <button 
                onClick={handleRetry}
                className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {view === ViewState.PORTFOLIO && (
            <PortfolioView 
              items={portfolioItems} 
              onUpdate={handleUpdatePortfolio} 
              onAnalyze={handleAnalyzePortfolio} 
            />
          )}

          {view === ViewState.BUBBLE_SCOPE && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="flex items-center justify-between mb-8">
                     <button 
                      onClick={() => { setView(ViewState.DASHBOARD); handleNavClick('Markets'); }}
                      className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                     >
                       ← Dashboard
                     </button>
                     <div className="flex items-center gap-2">
                         <span className="relative flex h-2.5 w-2.5">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                         </span>
                         <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Live Risk Monitor</span>
                     </div>
                  </div>
                  <BubbleScopeView data={result} onScan={handleBubbleScope} isLoading={loading} />
              </div>
          )}

          {view === ViewState.REPORT && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-8">
                 <button 
                  onClick={() => { setView(ViewState.DASHBOARD); handleNavClick('Markets'); }}
                  className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                 >
                   ← Dashboard
                 </button>
              </div>
              <AnalysisView data={result} title={analyzedQuery} />
            </div>
          )}

          {view === ViewState.DASHBOARD && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in fade-in slide-in-from-bottom-5">
               <div className="glass-card p-8 rounded-2xl group cursor-pointer" onClick={() => performAnalysis('Deep Fundamental Scan of major tech stocks')}>
                  <div className="w-14 h-14 bg-sky-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-sky-500/20 transition-colors border border-sky-500/20">
                     <BarChart3 className="w-7 h-7 text-sky-400" />
                  </div>
                  <h3 className="font-extrabold text-xl text-white mb-3">Fundamental Scan</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Automated analysis of P/E, PEG, debt ratios, and cash flow health against sector peers.</p>
               </div>
               <div className="glass-card p-8 rounded-2xl group cursor-pointer" onClick={() => performAnalysis('Find fair value estimates for trending stocks')}>
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                     <DollarSign className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="font-extrabold text-xl text-white mb-3">Fair Value Audit</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">AI-driven intrinsic valuation models to detect over-hyped assets and hidden gems.</p>
               </div>
               <div className="glass-card p-8 rounded-2xl group cursor-pointer" onClick={() => { setView(ViewState.BUBBLE_SCOPE); setResult(null); }}>
                  <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-500/20 transition-colors border border-rose-500/20">
                     <PieChart className="w-7 h-7 text-rose-400" />
                  </div>
                  <h3 className="font-extrabold text-xl text-white mb-3">Bubble Detection</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">Comparative historical analysis to identify unsustainable parabolic moves and crash risks.</p>
               </div>
            </div>
          )}
        </main>
        
        <footer className="mt-20 py-8 border-t border-slate-800/50">
           <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-[10px] text-slate-600 max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-mono">
                 System Status: Operational // Latency: 12ms // Region: US-EAST
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default App;