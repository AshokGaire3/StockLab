import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
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
      className="group glass-panel-hover rounded-xl p-5 cursor-pointer transition-all duration-150"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              {stock.symbol}
            </h3>
            {stock.source === 'live' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Live quote" />
            )}
          </div>
          <p className="text-slate-400 text-xs truncate max-w-[160px]" title={stock.name}>
            {stock.name}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
            isPositive ? 'pill-green' : 'pill-red'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(stock.changePercent)}
        </div>
      </div>

      {/* Price & Sparkline */}
      <div className="flex justify-between items-end my-3">
        <div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatPrice(stock.price)}
          </div>
          <div className={`text-xs font-medium mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatChange(stock.change)} Today
          </div>
        </div>

        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
          <Sparkline isPositive={isPositive} width={100} height={32} />
        </div>
      </div>

      {/* Footer Range Bar */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <BarChart3 className="w-3 h-3 text-slate-500" /> Vol: <span className="font-mono text-slate-300">{formatVolume(stock.volume)}</span>
          </span>
          <span className="font-mono text-slate-400">
            L: {formatPrice(stock.low)} — H: {formatPrice(stock.high)}
          </span>
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
    </div>
  );
};