import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { StockData } from '../types/financial';

interface MarketOverviewProps {
  stocks: StockData[];
  onSelectStock?: (symbol: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ stocks, onSelectStock }) => {
  const liveCount = stocks.filter((stock) => stock.source === 'live').length;
  const allLive = stocks.length > 0 && liveCount === stocks.length;

  const [marketData, setMarketData] = useState({
    totalMarketCap: 0,
    gainersCount: 0,
    losersCount: 0,
    averageChange: 0,
    topGainer: null as StockData | null,
    topLoser: null as StockData | null,
  });

  useEffect(() => {
    if (stocks.length === 0) return;

    const gainers = stocks.filter((stock) => stock.changePercent > 0);
    const losers = stocks.filter((stock) => stock.changePercent < 0);
    const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock.marketCap || 0), 0);
    const averageChange = stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length;

    const topGainer = stocks.reduce((prev, current) =>
      current.changePercent > prev.changePercent ? current : prev
    );

    const topLoser = stocks.reduce((prev, current) =>
      current.changePercent < prev.changePercent ? current : prev
    );

    setMarketData({
      totalMarketCap,
      gainersCount: gainers.length,
      losersCount: losers.length,
      averageChange,
      topGainer,
      topLoser,
    });
  }, [stocks]);

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    return `$${(value / 1e6).toFixed(2)}M`;
  };

  const isMarketUp = marketData.averageChange > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Total Market Cap */}
      <div className="glass-panel-hover p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Market Cap</span>
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl font-bold text-white font-mono tracking-tight">
          {formatMarketCap(marketData.totalMarketCap)}
        </div>
        <div className={`text-xs font-medium mt-1 ${isMarketUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isMarketUp ? '+' : ''}{marketData.averageChange.toFixed(2)}% Avg
        </div>
      </div>

      {/* Market Breadth (Advancing / Declining) */}
      <div className="glass-panel-hover p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Advancing / Declining</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
          <span className="text-emerald-400">{marketData.gainersCount}</span>
          <span className="text-slate-600 text-sm font-normal">/</span>
          <span className="text-red-400">{marketData.losersCount}</span>
        </div>
        <div className="text-slate-400 text-xs font-medium mt-1">
          {stocks.length > 0 ? ((marketData.gainersCount / stocks.length) * 100).toFixed(0) : 0}% Up today
        </div>
      </div>

      {/* Top Gainer */}
      {marketData.topGainer ? (
        <div
          onClick={() => onSelectStock?.(marketData.topGainer!.symbol)}
          className="glass-panel-hover p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Top Gainer</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold pill-green">
              +{marketData.topGainer.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-bold text-white">{marketData.topGainer.symbol}</span>
            <span className="text-sm font-bold text-white font-mono">${marketData.topGainer.price.toFixed(2)}</span>
          </div>
          <div className="text-slate-400 text-xs truncate mt-0.5">{marketData.topGainer.name}</div>
        </div>
      ) : (
        <div className="glass-panel p-4" />
      )}

      {/* Top Loser */}
      {marketData.topLoser ? (
        <div
          onClick={() => onSelectStock?.(marketData.topLoser!.symbol)}
          className="glass-panel-hover p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Top Loser</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold pill-red">
              {marketData.topLoser.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-bold text-white">{marketData.topLoser.symbol}</span>
            <span className="text-sm font-bold text-white font-mono">${marketData.topLoser.price.toFixed(2)}</span>
          </div>
          <div className="text-slate-400 text-xs truncate mt-0.5">{marketData.topLoser.name}</div>
        </div>
      ) : (
        <div className="glass-panel p-4" />
      )}
    </div>
  );
};