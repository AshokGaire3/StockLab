import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price') return [`$${value.toFixed(2)}`, 'Closing Price'];
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
      <div className="glass-panel rounded-xl p-6 border border-slate-800 h-96 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span>Loading market history for {symbol}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-slate-800 h-96 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 font-medium mb-1">{error}</p>
          <p className="text-slate-500 text-sm">Could not retrieve chart data for {symbol}.</p>
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
    <div className="glass-panel rounded-xl p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-tight">{symbol}</h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                isPositiveTrend ? 'pill-green' : 'pill-red'
              }`}
            >
              {isPositiveTrend ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositiveTrend ? '+' : ''}{percentChange.toFixed(2)}% ({range}D)
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">Price movement history</p>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {[7, 30, 90].map((period) => (
            <button
              key={period}
              onClick={() => setRange(period)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                range === period
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {period}D
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              fontSize={11}
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
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[(min: number) => min * 0.98, (max: number) => max * 1.02]}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                padding: '8px 12px',
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
              activeDot={{ r: 5, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};