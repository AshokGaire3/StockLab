import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Command } from 'lucide-react';
import { StockData } from '../types/financial';
import { financialApi } from '../services/financialApi';

interface SearchBarProps {
  onSelectStock: (symbol: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectStock }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global ⌘K or Ctrl+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const searchStocks = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await financialApi.searchStocks(query);
        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelectStock = (symbol: string) => {
    onSelectStock(symbol);
    setQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tickers (AAPL, NVDA, TSLA...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-16 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              onClick={clearSearch}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Results Glass Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-modal rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto border border-slate-800 animate-fadeIn">
          {loading ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              <div className="animate-pulse">Searching markets...</div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2 divide-y divide-slate-800/60">
              {results.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock.symbol)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800/80 transition-colors flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs group-hover:border-blue-500/40">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">
                        {stock.symbol}
                      </div>
                      <div className="text-slate-400 text-xs truncate max-w-[180px]">{stock.name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-mono text-sm font-semibold">${stock.price.toFixed(2)}</div>
                    <div
                      className={`text-xs font-semibold ${
                        stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No matching assets found for "<span className="text-white">{query}</span>"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};