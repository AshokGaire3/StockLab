import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '../types/financial';
import { financialApi } from '../services/financialApi';
import { format } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  days?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ symbol, days = 30 }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(days);
  const [showSma, setShowSma] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const series = await financialApi.getHistory(symbol, range);
        setData(series.points);
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, range]);

  // Calculate 20-day Simple Moving Average
  const chartDataWithSma = useMemo(() => {
    if (!data.length) return [];
    const windowSize = Math.min(20, Math.max(2, Math.floor(data.length / 4)));
    return data.map((pt, idx) => {
      if (idx < windowSize - 1) return { ...pt, sma: undefined };
      const slice = data.slice(idx - windowSize + 1, idx + 1);
      const avg = slice.reduce((sum, item) => sum + item.price, 0) / windowSize;
      return { ...pt, sma: Number(avg.toFixed(2)) };
    });
  }, [data]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Closing Price'];
    if (name === 'sma') return [`$${Number(value).toFixed(2)}`, '20-Day SMA'];
    return [value, name];
  };

  const formatTooltipLabel = (label: string) => {
    try {
      return format(new Date(label), 'MMM dd, yyyy');
    } catch {
      return label;
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 h-96 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Fetching market history for {symbol}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 h-96 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 font-mono text-xs mb-1">{error}</p>
          <p className="text-slate-500 text-xs">Could not retrieve chart data for {symbol}.</p>
        </div>
      </div>
    );
  }

  const firstPrice = data.length > 0 ? data[0].price : 0;
  const lastPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const isPositiveTrend = lastPrice >= firstPrice;
  const priceChange = lastPrice - firstPrice;
  const percentChange = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

  const strokeColor = isPositiveTrend ? '#10B981' : '#EF4444';
  const gradientId = `chartGradient-${symbol}-${range}`;

  return (
    <div className="glass-panel p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-tight">{symbol}</h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-mono tabular-nums ${
                isPositiveTrend ? 'pill-green' : 'pill-red'
              }`}
            >
              {isPositiveTrend ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositiveTrend ? '+' : ''}{percentChange.toFixed(2)}% ({range}D)
            </span>
          </div>
          <p className="text-slate-400 text-xs font-mono mt-0.5">Historical Market Time Series</p>
        </div>

        {/* Technical Controls & Range Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSma(!showSma)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-colors ${
              showSma
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle 20-Day Simple Moving Average"
          >
            SMA 20
          </button>

          <div className="flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {[7, 30, 90, 365].map((period) => (
              <button
                key={period}
                onClick={() => setRange(period)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  range === period
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {period === 365 ? '1Y' : `${period}D`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartDataWithSma} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1B2433" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                try {
                  return format(new Date(value), 'MMM dd');
                } catch {
                  return value;
                }
              }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              axisLine={false}
              domain={[(min: number) => min * 0.98, (max: number) => max * 1.02]}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111722',
                border: '1px solid #2B3A52',
                borderRadius: '6px',
                color: '#E2E8F0',
                padding: '8px 12px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
              }}
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipLabel}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, fill: strokeColor }}
            />
            {showSma && (
              <Line
                type="monotone"
                dataKey="sma"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};