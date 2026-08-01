import React, { useEffect } from 'react';
import { X, TrendingUp, BarChart3 } from 'lucide-react';
import { StockData } from '../types/financial';
import { PriceChart } from './PriceChart';
import { rangePosition } from '../utils/range';

interface StockDetailModalProps {
  stock: StockData | null;
  onClose: () => void;
  onNavigateToChart: (symbol: string) => void;
  onNavigateToPredict: (symbol: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  onNavigateToChart,
  onNavigateToPredict,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!stock) return null;

  const isPositive = stock.changePercent >= 0;
  const formatPrice = (p: number) => `$${p.toFixed(2)}`;

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toString();
  };

  const formatMarketCap = (mc?: number) => {
    if (!mc) return 'N/A';
    if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
    if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
    return `$${mc.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl glass-modal rounded-xl p-5 max-h-[90vh] overflow-y-auto z-10 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{stock.symbol}</h2>
              <span
                className={`px-2 py-0.5 text-xs font-mono font-semibold rounded uppercase tracking-wider ${
                  stock.source === 'live'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {stock.source === 'live' ? 'LIVE MARKET QUOTE' : 'SYNTHETIC DEMO'}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{stock.name}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">Spot Price</div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">{formatPrice(stock.price)}</div>
            <div className={`text-xs font-semibold font-mono mt-0.5 tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">Session Range</div>
            <div className="flex justify-between text-xs text-slate-300 font-mono tabular-nums mb-2">
              <span>L: {formatPrice(stock.low)}</span>
              <span>H: {formatPrice(stock.high)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isPositive ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(5, Math.min(95, rangePosition(stock.price, stock.low, stock.high)))}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">Valuation & Liquidity</div>
            <div className="text-xs text-slate-300 mt-1 font-mono tabular-nums">
              <span className="text-slate-400">Volume: </span>
              <span className="font-semibold text-white">{formatVolume(stock.volume)}</span>
            </div>
            <div className="text-xs text-slate-300 mt-1 font-mono tabular-nums">
              <span className="text-slate-400">Market Cap: </span>
              <span className="font-semibold text-white">{formatMarketCap(stock.marketCap)}</span>
            </div>
          </div>
        </div>

        {/* Chart Preview */}
        <div className="mb-5">
          <PriceChart symbol={stock.symbol} days={30} />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">Proxy Feed: <span className="capitalize text-slate-200">{stock.source}</span></span>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onNavigateToChart(stock.symbol);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs border border-slate-700 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Technical History
            </button>
            <button
              onClick={() => {
                onNavigateToPredict(stock.symbol);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-mono font-semibold text-xs transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Forecast Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

