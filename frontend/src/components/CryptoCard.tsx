import React from 'react';
import { TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { CryptoData } from '../types/financial';
import { rangePosition } from '../utils/range';
import { Sparkline } from './Sparkline';

interface CryptoCardProps {
  crypto: CryptoData;
  onClick?: (symbol: string) => void;
}

export const CryptoCard: React.FC<CryptoCardProps> = ({ crypto, onClick }) => {
  const isPositive = crypto.price_change_24h >= 0;

  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString()}`;
  };

  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <div
      onClick={() => onClick?.(crypto.symbol)}
      className="group glass-panel-hover p-4 cursor-pointer transition-all duration-150"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center p-1">
            {crypto.image ? (
              <img src={crypto.image} alt={crypto.name} className="w-4 h-4 object-contain" />
            ) : (
              <Coins className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">
              {crypto.symbol.toUpperCase()}
            </h3>
            <p className="text-slate-400 text-xs truncate max-w-[140px] mt-0.5" title={crypto.name}>
              {crypto.name}
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-mono tabular-nums ${
            isPositive ? 'pill-green' : 'pill-red'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(crypto.price_change_percentage_24h)}
        </div>
      </div>

      {/* Price & Sparkline */}
      <div className="flex justify-between items-end my-2.5">
        <div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
            {formatPrice(crypto.current_price)}
          </div>
          <div className={`text-xs font-semibold font-mono mt-0.5 tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatChange(crypto.price_change_24h)} 24h
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
            Cap: <span className="text-slate-200 font-semibold">{formatMarketCap(crypto.market_cap)}</span>
          </span>
          <span className="text-slate-400">
            L: {formatPrice(crypto.low_24h)} — H: {formatPrice(crypto.high_24h)}
          </span>
        </div>

        <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isPositive ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{
              width: `${Math.max(5, Math.min(95, rangePosition(crypto.current_price, crypto.low_24h, crypto.high_24h)))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};