import React, { useState, useEffect } from 'react';
import { PortfolioItem } from '../types';
import { stocks } from '../data/stocks';
import { Plus, Trash2, PieChart, TrendingUp, RefreshCcw, Wallet, BrainCircuit, Minus, X, Check, ArrowRightLeft } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';

interface PortfolioViewProps {
  items: PortfolioItem[];
  onUpdate: (items: PortfolioItem[]) => void;
  onAnalyze: () => void;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1', '#ec4899'];

const PortfolioView: React.FC<PortfolioViewProps> = ({ items, onUpdate, onAnalyze }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<{ symbol: string; qty: string; cost: string }>({ symbol: '', qty: '', cost: '' });
  const [suggestions, setSuggestions] = useState<typeof stocks>([]);

  // Transaction Modal State
  const [transaction, setTransaction] = useState<{ type: 'buy' | 'sell', item: PortfolioItem } | null>(null);
  const [transQty, setTransQty] = useState('');
  const [transPrice, setTransPrice] = useState('');

  // Derived Stats
  const totalValue = items.reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0);
  const totalCost = items.reduce((acc, item) => acc + (item.buyPrice * item.quantity), 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setNewItem({ ...newItem, symbol: val });
    if (val.length > 0) {
      setSuggestions(stocks.filter(s => s.symbol.includes(val) || s.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const addAsset = () => {
    if (!newItem.symbol || !newItem.qty || !newItem.cost) return;
    const stock = stocks.find(s => s.symbol === newItem.symbol);
    const item: PortfolioItem = {
      id: Date.now().toString(),
      symbol: newItem.symbol,
      name: stock ? stock.name : newItem.symbol,
      quantity: parseFloat(newItem.qty),
      buyPrice: parseFloat(newItem.cost),
      currentPrice: parseFloat(newItem.cost) // Default to buy price initially
    };
    onUpdate([...items, item]);
    setNewItem({ symbol: '', qty: '', cost: '' });
    setIsAdding(false);
  };

  const removeAsset = (id: string) => {
    onUpdate(items.filter(i => i.id !== id));
  };

  const initiateTransaction = (type: 'buy' | 'sell', item: PortfolioItem) => {
      setTransaction({ type, item });
      setTransQty('');
      // Default to current market price for convenience
      setTransPrice(item.currentPrice.toFixed(2));
  };

  const executeTransaction = () => {
      if (!transaction) return;
      
      const qty = parseFloat(transQty);
      const price = parseFloat(transPrice);

      if (isNaN(qty) || qty <= 0) return;
      if (isNaN(price) || price < 0) return;

      const { item, type } = transaction;
      let newItems = [...items];
      const index = newItems.findIndex(i => i.id === item.id);
      
      if (index === -1) return;

      if (type === 'buy') {
          // Weighted Average Cost Logic
          const currentTotalCost = newItems[index].quantity * newItems[index].buyPrice;
          const newTransactionCost = qty * price;
          const newTotalQty = newItems[index].quantity + qty;
          const newAvgCost = (currentTotalCost + newTransactionCost) / newTotalQty;

          newItems[index].quantity = newTotalQty;
          newItems[index].buyPrice = newAvgCost;
          // Optionally update current price to reflect market data entered? 
          // Let's assume the user enters the execution price which might be the current market price.
          newItems[index].currentPrice = price; 
      } else {
          // Sell Logic
          if (qty >= newItems[index].quantity) {
              // Sell all
              newItems = newItems.filter(i => i.id !== item.id);
          } else {
              newItems[index].quantity -= qty;
              // Update current price to reflect last transaction price
              newItems[index].currentPrice = price;
          }
      }

      onUpdate(newItems);
      setTransaction(null);
  };

  const refreshPrices = () => {
    // Simulates a price update for demo purposes
    const updated = items.map(item => ({
      ...item,
      currentPrice: item.buyPrice * (1 + (Math.random() * 0.2 - 0.05)) // Random -5% to +15%
    }));
    onUpdate(updated);
  };

  const chartData = items.map(item => ({
    name: item.symbol,
    value: item.quantity * item.currentPrice
  }));

  return (
    <div className="pb-20 animate-fade-in relative">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-white/5 pb-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Portfolio Command</h2>
            <p className="text-slate-400 text-sm font-medium">Track holdings, simulate shifts, and audit risk.</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
             <button onClick={refreshPrices} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors border border-slate-600 text-xs font-bold uppercase tracking-wider">
                <RefreshCcw className="w-4 h-4" /> Simulate Market Data
             </button>
             <button onClick={onAnalyze} className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition-colors font-bold shadow-lg shadow-sky-900/30 text-xs uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4" /> AI Risk Audit
             </button>
          </div>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl">
             <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-sky-400" /> Net Worth
             </div>
             <div className="text-3xl font-black text-white font-mono tracking-tight">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
             <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Total P/L ($)
             </div>
             <div className={`text-3xl font-black font-mono tracking-tight ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPL >= 0 ? '+' : ''}{totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
             <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" /> Total P/L (%)
             </div>
             <div className={`text-3xl font-black font-mono tracking-tight ${totalPLPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Holdings List */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Holdings</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 uppercase tracking-wider bg-sky-950/30 px-3 py-1.5 rounded-lg border border-sky-500/20">
                   <Plus className="w-4 h-4" /> Add Asset
                </button>
             </div>

             {isAdding && (
                <div className="glass-card p-5 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2 border border-sky-500/20">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="relative">
                         <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Symbol</label>
                         <input 
                           type="text" 
                           value={newItem.symbol} 
                           onChange={handleSymbolChange}
                           className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none font-mono"
                           placeholder="AAPL"
                         />
                         {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 z-50 rounded-b-lg mt-1 shadow-xl">
                               {suggestions.map(s => (
                                  <div key={s.symbol} onClick={() => { setNewItem({ ...newItem, symbol: s.symbol }); setSuggestions([]); }} className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-xs flex justify-between">
                                     <span className="font-bold text-sky-400 font-mono">{s.symbol}</span> <span className="text-slate-400">{s.name}</span>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                      <div>
                         <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Quantity</label>
                         <input 
                           type="number" 
                           value={newItem.qty} 
                           onChange={e => setNewItem({ ...newItem, qty: e.target.value })}
                           className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none font-mono"
                           placeholder="0"
                         />
                      </div>
                      <div>
                         <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Avg Price</label>
                         <input 
                           type="number" 
                           value={newItem.cost} 
                           onChange={e => setNewItem({ ...newItem, cost: e.target.value })}
                           className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none font-mono"
                           placeholder="$0.00"
                         />
                      </div>
                      <button onClick={addAsset} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors shadow-lg shadow-emerald-900/20">
                         Save
                      </button>
                   </div>
                </div>
             )}

             <div className="glass-card rounded-2xl overflow-hidden min-h-[300px]">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                         <th className="px-6 py-4">Asset</th>
                         <th className="px-6 py-4 text-right">Qty</th>
                         <th className="px-6 py-4 text-right">Avg Cost</th>
                         <th className="px-6 py-4 text-right">Price (Sim)</th>
                         <th className="px-6 py-4 text-right">Value</th>
                         <th className="px-6 py-4 text-right">P/L</th>
                         <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {items.map((item) => {
                         const val = item.quantity * item.currentPrice;
                         const pl = val - (item.quantity * item.buyPrice);
                         const plPer = (pl / (item.quantity * item.buyPrice)) * 100;
                         return (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                               <td className="px-6 py-4">
                                  <div className="font-bold text-white font-mono">{item.symbol}</div>
                                  <div className="text-xs text-slate-500 truncate max-w-[150px] font-medium">{item.name}</div>
                               </td>
                               <td className="px-6 py-4 text-right text-slate-300 font-mono">{item.quantity.toLocaleString()}</td>
                               <td className="px-6 py-4 text-right text-slate-300 font-mono">${item.buyPrice.toFixed(2)}</td>
                               <td className="px-6 py-4 text-right text-sky-300 font-mono font-bold">${item.currentPrice.toFixed(2)}</td>
                               <td className="px-6 py-4 text-right font-bold text-white font-mono">${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                               <td className="px-6 py-4 text-right">
                                  <div className={`font-bold font-mono ${pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                     {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                                  </div>
                                  <div className={`text-[10px] font-bold ${pl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                     {plPer.toFixed(2)}%
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => initiateTransaction('buy', item)} 
                                        className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                                        title="Buy More"
                                      >
                                          <Plus className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => initiateTransaction('sell', item)}
                                        className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                                        title="Sell"
                                      >
                                          <Minus className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => removeAsset(item.id)} 
                                        className="p-1.5 rounded-md text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                        title="Remove Asset"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                               </td>
                            </tr>
                         );
                      })}
                      {items.length === 0 && (
                         <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                               No assets in portfolio. Click "Add Asset" to start tracking.
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Allocation Chart */}
          <div className="glass-card p-6 rounded-2xl h-96">
             <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Allocation</h3>
             {items.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
                   <RePieChart>
                      <Pie
                         data={chartData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1e293b" strokeWidth={2} />
                         ))}
                      </Pie>
                      <ReTooltip 
                         contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px', backdropFilter: 'blur(4px)' }}
                         itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                   </RePieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs font-medium uppercase tracking-widest">
                   Awaiting Data
                </div>
             )}
          </div>
       </div>

       {/* Transaction Modal */}
       {transaction && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden">
                   <div className={`p-6 border-b border-white/5 flex items-center justify-between ${transaction.type === 'buy' ? 'bg-emerald-950/30' : 'bg-amber-950/30'}`}>
                       <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${transaction.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                               {transaction.type === 'buy' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                           </div>
                           <div>
                               <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                   {transaction.type === 'buy' ? 'Buy Position' : 'Sell Position'}
                               </h3>
                               <p className="text-xs text-slate-400 font-mono">{transaction.item.symbol} • {transaction.item.name}</p>
                           </div>
                       </div>
                       <button onClick={() => setTransaction(null)} className="text-slate-500 hover:text-white transition-colors">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <div className="p-6 space-y-5">
                       <div>
                           <label className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">Transaction Quantity</label>
                           <input 
                             type="number" 
                             value={transQty} 
                             onChange={e => setTransQty(e.target.value)}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-sky-500 focus:outline-none font-mono text-lg"
                             placeholder="0"
                             autoFocus
                           />
                           {transaction.type === 'sell' && (
                               <div className="text-right mt-1 text-[10px] text-slate-500 font-mono">
                                   Max: {transaction.item.quantity}
                               </div>
                           )}
                       </div>

                       <div>
                           <label className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">Execution Price ($)</label>
                           <input 
                             type="number" 
                             value={transPrice} 
                             onChange={e => setTransPrice(e.target.value)}
                             className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-sky-500 focus:outline-none font-mono text-lg"
                             placeholder="0.00"
                           />
                       </div>

                       <div className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-center border border-white/5">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Value</span>
                           <span className="text-xl font-black text-white font-mono">
                               ${((parseFloat(transQty) || 0) * (parseFloat(transPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </span>
                       </div>

                       <button 
                           onClick={executeTransaction}
                           disabled={!transQty || !transPrice}
                           className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                               transaction.type === 'buy' 
                               ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' 
                               : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                           } disabled:opacity-50 disabled:cursor-not-allowed`}
                       >
                           {transaction.type === 'buy' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                           Confirm Transaction
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default PortfolioView;