import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Command } from 'lucide-react';
import { stocks } from '../data/stocks';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: (query: string) => void;
  loading: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch, loading, className }) => {
  const [suggestions, setSuggestions] = useState<typeof stocks>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useLayoutEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 0) {
      const lowerQuery = value.toLowerCase();
      
      const filtered = stocks
        .filter(stock => 
          stock.symbol.toLowerCase().includes(lowerQuery) || 
          stock.name.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => {
            const aSymbol = a.symbol.toLowerCase();
            const bSymbol = b.symbol.toLowerCase();
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            // Priority 1: Exact symbol match
            if (aSymbol === lowerQuery && bSymbol !== lowerQuery) return -1;
            if (bSymbol === lowerQuery && aSymbol !== lowerQuery) return 1;

            // Priority 2: Symbol starts with query
            const aStartsSymbol = aSymbol.startsWith(lowerQuery);
            const bStartsSymbol = bSymbol.startsWith(lowerQuery);
            if (aStartsSymbol && !bStartsSymbol) return -1;
            if (!aStartsSymbol && bStartsSymbol) return 1;

            // Priority 3: Name starts with query
            const aStartsName = aName.startsWith(lowerQuery);
            const bStartsName = bName.startsWith(lowerQuery);
            if (aStartsName && !bStartsName) return -1;
            if (!aStartsName && bStartsName) return 1;

            // Priority 4: Alphabetical
            return a.symbol.localeCompare(b.symbol);
        });
        
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (stock: typeof stocks[0]) => {
    const newQuery = `${stock.symbol} - ${stock.name}`;
    setQuery(newQuery);
    setShowSuggestions(false);
    onSearch(newQuery);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className} group`}>
      {/* 
        PREMIUM SEARCH INPUT 
        Gradient border is achieved via a background on the parent div and a slightly smaller inner bg.
      */}
      <div 
        className={`relative rounded-xl p-[1px] transition-all duration-500 ${
          isFocused 
            ? 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        <form onSubmit={handleSubmit} className="relative flex bg-[#0f172a] rounded-[11px] overflow-hidden">
           <div className="pl-5 flex items-center justify-center text-slate-500">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-slate-500 border-t-transparent rounded-full"/> : <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-cyan-400' : 'text-slate-500'}`} />}
           </div>
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={handleInputChange}
            onFocus={() => { setIsFocused(true); if(query.length > 0) setShowSuggestions(true); }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search ticker, sector, or market topic..."
            className="w-full bg-transparent text-white placeholder-slate-500 border-none py-4 px-4 focus:outline-none focus:ring-0 text-lg font-medium tracking-wide"
            disabled={loading}
          />
          <div className="pr-4 flex items-center">
             <button 
                type="submit"
                className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 ${isFocused ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20' : 'text-slate-500 border-slate-800 bg-slate-900 hover:text-white hover:bg-slate-800'}`}
             >
                <Search className="w-4 h-4" />
             </button>
          </div>
        </form>
      </div>

      {/* PORTALED DROPDOWN */}
      {showSuggestions && suggestions.length > 0 && createPortal(
        <div 
          className="fixed bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto ring-1 ring-white/5 isolate pointer-events-auto no-scrollbar"
          style={{ 
            top: `${dropdownPos.top + 8}px`, 
            left: `${dropdownPos.left}px`, 
            width: `${dropdownPos.width}px`,
            zIndex: 9999,
          }}
        >
          {suggestions.map((stock) => (
            <div 
              key={stock.symbol}
              className="px-5 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0 group/item"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectSuggestion(stock);
              }}
            >
              <div className="flex flex-col">
                <span className="font-bold text-white text-base group-hover/item:text-cyan-400 transition-colors">
                  {stock.symbol}
                </span>
                <span className="text-xs text-slate-500 font-medium">{stock.name}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase">
                  {stock.exchange}
              </span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchBar;