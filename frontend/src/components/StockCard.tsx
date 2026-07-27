import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockData } from '../types/financial';
import { rangePosition } from '../utils/range';
import { Sparkline } from './Sparkline';

interface StockCardProps {
  stock: StockData;
  onClick?: (symbol: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onClick }) => {
  const isPositive = stock.change >= 0;
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div
      onClick={() => onClick?.(stock.symbol)}
      className="group glass-panel-hover p-4 cursor-pointer transition-all duration-150"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">
              {stock.symbol}
            </h3>
            <span
              className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded uppercase tracking-wider ${
                stock.source === 'live'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {stock.source === 'live' ? 'LIVE' : 'DEMO'}
            </span>
          </div>
          <p className="text-slate-400 text-xs truncate max-w-[160px] mt-0.5" title={stock.name}>
            {stock.name}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-mono tabular-nums ${
            isPositive ? 'pill-green' : 'pill-red'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(stock.changePercent)}
        </div>
      </div>

      {/* Price & Sparkline */}
      <div className="flex justify-between items-end my-2.5">
        <div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
            {formatPrice(stock.price)}
          </div>
          <div className={`text-xs font-semibold font-mono mt-0.5 tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatChange(stock.change)} Today
          </div>
        </div>

        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          <Sparkline isPositive={isPositive} width={96} height={28} />
        </div>
      </div>

      {/* Footer Range Bar */}
      <div className="space-y-1.5 pt-2.5 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono tabular-nums">
          <span className="text-slate-400">
            Vol: <span className="text-slate-200 font-semibold">{formatVolume(stock.volume)}</span>
          </span>
          <span className="text-slate-400">
            L: {formatPrice(stock.low)} — H: {formatPrice(stock.high)}
          </span>
        </div>

        <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isPositive ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(5, Math.min(95, rangePosition(stock.price, stock.low, stock.high)))}%` }}
          />
        </div>
      </div>
    </div>
  );
};